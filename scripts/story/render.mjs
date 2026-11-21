// Records the home page's story illustrations (scenes.html, three.js) into
// public/story/<scene>.mp4, a silent six-second loop, and <scene>.jpg, its
// poster (components/Media.tsx shows the poster until the loop plays).
// Run, with the repository's root served on port 3170 (for example
// `python3 -m http.server 3170`) and ffmpeg on PATH, on a machine with a GPU:
//   node scripts/story/render.mjs [scene ...]
import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { chromium } from '@playwright/test';

const here = dirname(fileURLToPath(import.meta.url));
const out = join(here, '../../public/story');
const FPS = 24;
// The poster: the loop's first frame, so nothing jumps as the loop starts
// over the poster (as for the portfolio's loops: portfolio.md).
const POSTER_AT = 0;

mkdirSync(out, { recursive: true });
// Drawn by the GPU (Metal on a Mac): in software the scenes take seconds a
// frame and lose their reflections.
const browser = await chromium.launch({
  args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'],
});
const SCENES_URL =
  process.env.STORY_SCENES ?? 'http://localhost:3170/scripts/story/scenes.html';
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
await page.goto(`${SCENES_URL}?scene=texas-tech`);
await page.waitForFunction(() => window.ready, null, { timeout: 60_000 });
const all = await page.evaluate(() => window.SCENES);
const scenes = process.argv.slice(2).length ? process.argv.slice(2) : all;

for (const scene of scenes) {
  await page.goto(`${SCENES_URL}?scene=${scene}`);
  await page.waitForFunction(() => window.ready, null, { timeout: 60_000 });
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
