// Builds components/Background/files/glasses.bin: the Banner Eyewear
// sunglasses (Zack's own models, from the banner-builder repository's
// public/3DModels) for the home page's story, which drops them onto the
// head's face (components/Background/StoryProps.tsx).
// Run: node scripts/story/build-glasses.mjs [path to banner-builder/public/3DModels]
//
// The file, gzipped: a JSON header (length as a Uint32, then the JSON), then
// for each part its positions (Float32 x3), normals (Int8 x3, scaled to 127)
// and triangle indices (Uint32), each section padded to 4 bytes. All parts
// share the builder's coordinates (the front frame's lenses face +z).
import { readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';

import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import {
  mergeGeometries,
  mergeVertices,
} from 'three/examples/jsm/utils/BufferGeometryUtils.js';

const here = dirname(fileURLToPath(import.meta.url));
const models =
  process.argv[2] ?? join(homedir(), 'Desktop/banner-builder/public/3DModels');
const PARTS = {
  frame: 'Helm-Front-Frame.obj',
  lenses: 'Helm-Lenses.obj',
  left: 'Left/Helm-Left-Frame-Logo.obj',
  right: 'Right/Helm-Right-Frame-Logo.obj',
};

const header = { parts: {} };
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

for (const [name, file] of Object.entries(PARTS)) {
  const group = new OBJLoader().parse(readFileSync(join(models, file), 'utf8'));
  const geometries = [];
  group.traverse((o) => {
    if (o.isMesh) {
      const g = o.geometry.clone();
      g.deleteAttribute('uv');
      g.deleteAttribute('normal');
      geometries.push(g);
    }
  });
  const merged = mergeVertices(mergeGeometries(geometries), 1e-3);
  merged.computeVertexNormals();
  const position = new Float32Array(merged.getAttribute('position').array);
  const normalF = merged.getAttribute('normal').array;
  const normal = new Int8Array(normalF.length);
  for (let i = 0; i < normalF.length; i++)
    normal[i] = Math.round(normalF[i] * 127);
  const index = new Uint32Array(merged.getIndex().array);
  header.parts[name] = {
    vertices: position.length / 3,
    triangles: index.length / 3,
    position: push(position),
    normal: push(normal),
    index: push(index),
  };
}

const json = Buffer.from(JSON.stringify(header));
const lead = Buffer.alloc(4);
lead.writeUInt32LE(json.length);
const pad = Buffer.alloc((4 - ((4 + json.length) % 4)) % 4);
const body = Buffer.concat([lead, json, pad, ...chunks]);
const out = join(here, '../../components/Background/files/glasses.bin');
writeFileSync(out, gzipSync(body, { level: 9 }));
process.stdout.write(`${out}: ${JSON.stringify(header.parts)}\n`);
