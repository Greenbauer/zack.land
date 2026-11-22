// Builds components/Background/files/glasses.bin: the Banner Eyewear
// sunglasses for the home page's story, which drops them onto the head's
// face (components/Background/StoryProps.tsx). Their front frame, lenses and
// arms are Zack's own models, from the banner-builder repository's
// public/3DModels; the words on their arms (BANNER on the right, EYEWEAR on
// the left) are built by that site's own code, run here in a browser with
// the words typed in, so they are warped, extruded and bent as it does them.
// Run: node scripts/story/build-glasses.mjs [path to banner-builder/public]
//
// The file, gzipped: a JSON header (length as a Uint32, then the JSON), then
// for each part its positions (Int16 x3, in 1/UNIT millimetres) and triangle
// indices (Uint16, or Uint32 for a part of more than 65535 vertices), each
// section padded to 4 bytes. No normals: the page works them out from the
// triangles, and a hard edge (a letter's) is kept by its two faces not
// sharing vertices. All parts share the builder's coordinates (the front
// frame's lenses face +z).
import { readFileSync, writeFileSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { dirname, extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';

import { chromium } from '@playwright/test';
import { BufferAttribute, BufferGeometry } from 'three';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import {
  mergeGeometries,
  mergeVertices,
  toCreasedNormals,
} from 'three/examples/jsm/utils/BufferGeometryUtils.js';

const here = dirname(fileURLToPath(import.meta.url));
const site =
  process.argv[2] ?? join(homedir(), 'Desktop/banner-builder/public');
const MODELS = {
  frame: 'Helm-Front-Frame.obj',
  lenses: 'Helm-Lenses.obj',
  left: 'Left/Helm-Left-Frame-Logo.obj',
  right: 'Right/Helm-Right-Frame-Logo.obj',
};
// What each arm says, in the builder's own default font. The right arm is
// the one that shows as the head looks at a card, so it reads first.
const WORDS = { Left: 'EYEWEAR', Right: 'BANNER' };
const FONT = 'Days Sans';
// Positions are kept to 1/200 mm: the glasses are 160 mm across.
const UNIT = 200;

// The words, as the builder site makes them: its page is served from this
// checkout under its own address (it rewrites its address bar to there),
// with the words in its query.
async function letters() {
  const ORIGIN = 'https://banner-eyewear.zack.land';
  const types = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.svg': 'image/svg+xml',
  };
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.route(`${ORIGIN}/**`, async (route) => {
    const path = decodeURIComponent(new URL(route.request().url()).pathname);
    const file = path === '/' ? '/index.html' : path;
    try {
      await route.fulfill({
        body: await readFile(join(site, file)),
        contentType: types[extname(file)] ?? 'application/octet-stream',
      });
    } catch {
      await route.fulfill({ status: 404, body: '' });
    }
  });
  const query = new URLSearchParams({
    'left-text': WORDS.Left,
    'right-text': WORDS.Right,
    'left-font': FONT,
    'right-font': FONT,
    'left-icon': 'Logo',
    'right-icon': 'Logo',
    side: 'FRL',
  });
  await page.goto(`${ORIGIN}/?${query}`);
  // Each word's mesh is replaced when its text has been built; the page
  // says which text it built last (selected), and bends the mesh at once.
  await page.waitForFunction(
    (words) =>
      typeof LLetters !== 'undefined' &&
      typeof RLetters !== 'undefined' &&
      LLetters &&
      RLetters &&
      selected.Left.text === words.Left &&
      selected.Right.text === words.Right,
    WORDS,
    { timeout: 120_000 },
  );
  await page.waitForTimeout(2000);
  const out = await page.evaluate(() => {
    const world = (mesh) => {
      mesh.updateMatrixWorld();
      const position = [];
      for (const v of mesh.geometry.vertices) {
        const at = v.clone().applyMatrix4(mesh.matrixWorld);
        position.push(at.x, at.y, at.z);
      }
      const index = [];
      for (const f of mesh.geometry.faces) index.push(f.a, f.b, f.c);
      return { position, index };
    };
    return { leftText: world(LLetters), rightText: world(RLetters) };
  });
  await browser.close();
  return out;
}

const header = { unit: UNIT, parts: {} };
const chunks = [];
let offset = 0;
const push = (bytes) => {
  const pad = (4 - (bytes.byteLength % 4)) % 4;
  chunks.push(
    Buffer.from(bytes.buffer, bytes.byteOffset, bytes.byteLength),
    Buffer.alloc(pad),
  );
  const at = offset;
  offset += bytes.byteLength + pad;
  return at;
};
// A part's faces meeting at more than `crease` radians keep their own
// vertices there, so the edge between them stays sharp; the rest share.
const add = (name, geometry, crease = Math.PI) => {
  const merged = mergeVertices(
    toCreasedNormals(mergeVertices(geometry, 1e-3), crease),
    1e-3,
  );
  const positionF = merged.getAttribute('position').array;
  const position = new Int16Array(positionF.length);
  for (let i = 0; i < positionF.length; i++)
    position[i] = Math.round(positionF[i] * UNIT);
  const vertices = position.length / 3;
  const index = (vertices > 65535 ? Uint32Array : Uint16Array).from(
    merged.getIndex().array,
  );
  header.parts[name] = {
    vertices,
    triangles: index.length / 3,
    position: push(position),
    index: push(index),
  };
};

for (const [name, file] of Object.entries(MODELS)) {
  const group = new OBJLoader().parse(
    readFileSync(join(site, '3DModels', file), 'utf8'),
  );
  const geometries = [];
  group.traverse((o) => {
    if (o.isMesh) {
      const g = o.geometry.clone();
      g.deleteAttribute('uv');
      g.deleteAttribute('normal');
      geometries.push(g);
    }
  });
  add(name, mergeGeometries(geometries));
}
for (const [name, { position, index }] of Object.entries(await letters())) {
  const geometry = new BufferGeometry();
  geometry.setAttribute(
    'position',
    new BufferAttribute(new Float32Array(position), 3),
  );
  geometry.setIndex(index);
  // Letters are flat faces with bevelled edges: sharp past 35 degrees.
  add(name, geometry, (35 * Math.PI) / 180);
}

const json = Buffer.from(JSON.stringify(header));
const lead = Buffer.alloc(4);
lead.writeUInt32LE(json.length);
const pad = Buffer.alloc((4 - ((4 + json.length) % 4)) % 4);
const body = Buffer.concat([lead, json, pad, ...chunks]);
const out = join(here, '../../components/Background/files/glasses.bin');
const zipped = gzipSync(body, { level: 9 });
writeFileSync(out, zipped);
process.stdout.write(
  `${out} (${zipped.length} bytes): ${JSON.stringify(header.parts)}\n`,
);
