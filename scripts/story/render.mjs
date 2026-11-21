// Records the home page's story illustrations (illustrations.html) into
// public/story/<scene>.mp4, a silent six-second loop, and <scene>.jpg, its
// poster (components/Media.tsx shows the poster until the loop plays).
// Run: node scripts/story/render.mjs [scene ...]   (needs ffmpeg on PATH)
import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { chromium } from '@playwright/test';

const here = dirname(fileURLToPath(import.meta.url));
const out = join(here, '../../public/story');
const FPS = 24;
// The poster: a frame most of the way into the loop, where each scene shows
// what it is about.
const POSTER_AT = 4.8;

mkdirSync(out, { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
await page.goto(
  `file://${join(here, 'illustrations.html')}?scene=texas-tech&t=0`,
);
await page.evaluate(() => document.fonts.ready);
const all = await page.evaluate(() => window.SCENES);
const scenes = process.argv.slice(2).length ? process.argv.slice(2) : all;

for (const scene of scenes) {
  await page.goto(
    `file://${join(here, 'illustrations.html')}?scene=${scene}&t=0`,
  );
  await page.evaluate(() => document.fonts.ready);
  const loop = await page.evaluate(() => window.LOOP);
  const ffmpeg = spawn(
    'ffmpeg',
    [
      '-y',
      '-loglevel',
      'error',
      '-f',
      'image2pipe',
      '-vcodec',
      'mjpeg',
      '-framerate',
      String(FPS),
      '-i',
      '-',
      '-c:v',
      'libx264',
      '-pix_fmt',
      'yuv420p',
      '-crf',
      '30',
      '-preset',
      'slow',
      '-an',
      '-movflags',
      '+faststart',
      join(out, `${scene}.mp4`),
    ],
    { stdio: ['pipe', 'inherit', 'inherit'] },
  );
  for (let f = 0; f < loop * FPS; f++) {
    await page.evaluate((t) => window.render(t), f / FPS);
    const frame = await page.screenshot({ type: 'jpeg', quality: 92 });
    if (!ffmpeg.stdin.write(frame))
      await new Promise((r) => ffmpeg.stdin.once('drain', r));
  }
  ffmpeg.stdin.end();
  await new Promise((r) => ffmpeg.on('close', r));
  await page.evaluate((t) => window.render(t), POSTER_AT);
  await page.screenshot({
    path: join(out, `${scene}.jpg`),
    type: 'jpeg',
    quality: 82,
  });
  process.stdout.write(`public/story/${scene}.mp4\n`);
}
await browser.close();
