// Builds public/background/environment/kiara_1_dawn_1k_pmrem.hdr: the scene's
// sky (scripts/environment/kiara_1_dawn_1k.hdr) as three draws it for reflections and the blurred
// background, prefiltered here once instead of in every visitor's browser.
//
//   node scripts/build-environment.mjs
//
// three turns an equirectangular sky into a "cube UV" atlas (its
// PMREMGenerator): the sky's six cube faces, then each rougher level filtered
// by 256 GGX samples a pixel. Done on the page as it loads, that took a GPU a
// moment but a browser drawing WebGL on its CPU (a CI runner, a virtual
// machine) 2 to 15 seconds, all of it waited on by the page's main thread as
// the scene's first frame went to the screen (components/Background/
// skyLoader.ts). This runs the same three, the version package-lock.json
// pins, on the same sky loaded the same way (three-stdlib's RGBELoader, as
// drei's useEnvironment did), in Playwright's Chromium, reads the atlas back
// and writes it as Radiance RGBE, the sky file's own format, which the page
// loads with that loader. Run it again when three or the sky changes.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { chromium } from '@playwright/test';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const SKY = path.join(ROOT, 'scripts/environment/kiara_1_dawn_1k.hdr');
const THREE_VERSION = JSON.parse(
  fs.readFileSync(path.join(ROOT, 'node_modules/three/package.json'), 'utf8'),
).version;
const OUT = path.join(
  ROOT,
  'public/background/environment/kiara_1_dawn_1k_pmrem.hdr',
);

// The page: the sky prefiltered by three, read back as half floats, bottom
// row first (WebGL's order).
const PAGE = `<!doctype html><canvas></canvas>
<script type=importmap>{"imports":{"three":"/three/build/three.module.js"}}</script>
<script type=module>
import { EquirectangularReflectionMapping, PMREMGenerator, WebGLRenderer } from 'three';
import { RGBELoader } from '/three-stdlib/loaders/RGBELoader.js';
const renderer = new WebGLRenderer({ canvas: document.querySelector('canvas') });
const sky = await new RGBELoader().loadAsync('/sky.hdr');
sky.mapping = EquirectangularReflectionMapping;
sky.colorSpace = 'srgb-linear';
const target = new PMREMGenerator(renderer).fromEquirectangular(sky);
const { width, height } = target;
const pixels = new Uint16Array(width * height * 4);
renderer.readRenderTargetPixels(target, 0, 0, width, height, pixels);
const bytes = new Uint8Array(pixels.buffer);
let binary = '';
for (let i = 0; i < bytes.length; i += 0x8000)
  binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
window.atlas = { width, height, pixels: btoa(binary) };
</script>`;

async function prefilter() {
  const browser = await chromium.launch({
    args: ['--enable-unsafe-swiftshader'],
  });
  const page = await browser.newPage();
  page.on('pageerror', (error) => console.error(error));
  await page.route('http://prefilter.local/**', (route) => {
    const { pathname } = new URL(route.request().url());
    if (pathname === '/')
      return route.fulfill({ body: PAGE, contentType: 'text/html' });
    if (pathname === '/sky.hdr')
      return route.fulfill({ body: fs.readFileSync(SKY) });
    return route.fulfill({
      body: fs.readFileSync(path.join(ROOT, 'node_modules', pathname)),
      contentType: 'text/javascript',
    });
  });
  await page.goto('http://prefilter.local/');
  const atlas = await page
    .waitForFunction(() => window.atlas, null, { timeout: 120_000 })
    .then((handle) => handle.jsonValue());
  await browser.close();
  const buffer = Buffer.from(atlas.pixels, 'base64');
  return {
    width: atlas.width,
    height: atlas.height,
    halves: new Uint16Array(
      buffer.buffer,
      buffer.byteOffset,
      buffer.length / 2,
    ),
  };
}

// A half float's value.
function fromHalf(h) {
  const exponent = (h >> 10) & 0x1f;
  const fraction = h & 0x3ff;
  const sign = h & 0x8000 ? -1 : 1;
  if (exponent === 0) return sign * 2 ** -14 * (fraction / 1024);
  if (exponent === 31) return fraction ? NaN : sign * Infinity;
  return sign * 2 ** (exponent - 15) * (1 + fraction / 1024);
}

// A pixel as RGBE, as RGBELoader reads it back: each channel's byte times
// 2^(e - 128) / 255, e the shared exponent, the smallest that holds the
// brightest channel.
function toRgbe(r, g, b, out, at) {
  const top = Math.max(r, g, b);
  if (!(top > 1e-32)) {
    out.fill(0, at, at + 4);
    return;
  }
  const e = Math.ceil(Math.log2(top));
  const scale = 255 / 2 ** e;
  out[at] = Math.min(255, Math.round(r * scale));
  out[at + 1] = Math.min(255, Math.round(g * scale));
  out[at + 2] = Math.min(255, Math.round(b * scale));
  out[at + 3] = e + 128;
}

// One channel of a scanline, run-length encoded as Radiance's newer format
// has it: a run of 3 or more of one byte as 128 + its length (at most 127)
// and the byte, anything else as its length (at most 128) and the bytes.
function encodeChannel(bytes) {
  const out = [];
  let i = 0;
  while (i < bytes.length) {
    let run = 1;
    while (i + run < bytes.length && run < 127 && bytes[i + run] === bytes[i])
      run += 1;
    if (run >= 3) {
      out.push(128 + run, bytes[i]);
      i += run;
      continue;
    }
    let end = i;
    while (
      end < bytes.length &&
      end - i < 128 &&
      !(
        end + 2 < bytes.length &&
        bytes[end] === bytes[end + 1] &&
        bytes[end] === bytes[end + 2]
      )
    )
      end += 1;
    out.push(end - i, ...bytes.subarray(i, end));
    i = end;
  }
  return out;
}

// The atlas as a Radiance file: top scanline first, so with RGBELoader's
// flipY the texture is the right way up, as the atlas was drawn.
function toRadiance({ width, height, halves }) {
  const parts = [
    Buffer.from(
      `#?RADIANCE\n# three ${THREE_VERSION}'s PMREM of kiara_1_dawn_1k.hdr (scripts/build-environment.mjs)\nFORMAT=32-bit_rle_rgbe\n\n-Y ${height} +X ${width}\n`,
    ),
  ];
  const line = new Uint8Array(width * 4);
  for (let y = height - 1; y >= 0; y -= 1) {
    for (let x = 0; x < width; x += 1) {
      const at = (y * width + x) * 4;
      toRgbe(
        fromHalf(halves[at]),
        fromHalf(halves[at + 1]),
        fromHalf(halves[at + 2]),
        line,
        x * 4,
      );
    }
    const encoded = [2, 2, width >> 8, width & 0xff];
    for (let channel = 0; channel < 4; channel += 1)
      encoded.push(...encodeChannel(line.filter((_, k) => k % 4 === channel)));
    parts.push(Buffer.from(encoded));
  }
  return Buffer.concat(parts);
}

const atlas = await prefilter();
fs.writeFileSync(OUT, toRadiance(atlas));
process.stdout.write(
  `${path.relative(ROOT, OUT)}: ${atlas.width}x${atlas.height}, ${fs.statSync(OUT).size} bytes\n`,
);
