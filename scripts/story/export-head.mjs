// Writes the head's skin as an OBJ (head.obj), and where its eyes are
// (eyes.json), into a folder, for Blender to model the graduation cap on
// (cap.py):
//   node --experimental-strip-types scripts/story/export-head.mjs <folder>
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { gunzipSync } from 'node:zlib';

import { decodeHead } from '../../components/Background/headGeometry.ts';

const out = process.argv[2];
if (!out) throw new Error('Name the folder to write to.');
mkdirSync(out, { recursive: true });
const zipped = readFileSync(
  new URL('../../components/Background/files/head.bin', import.meta.url),
);
const raw = gunzipSync(zipped);
const head = decodeHead(
  raw.buffer.slice(raw.byteOffset, raw.byteOffset + raw.byteLength),
  [],
);
const skin = head.meshes.get('skin');
let obj = 'o skin\n';
for (let k = 0; k < skin.positions.length; k += 3)
  obj += `v ${skin.positions[k]} ${skin.positions[k + 1]} ${skin.positions[k + 2]}\n`;
for (let k = 0; k < skin.indices.length; k += 3)
  obj += `f ${skin.indices[k] + 1} ${skin.indices[k + 1] + 1} ${skin.indices[k + 2] + 1}\n`;
writeFileSync(join(out, 'head.obj'), obj);
const centre = (name) => {
  const p = head.meshes.get(name).positions;
  const lo = [Infinity, Infinity, Infinity];
  const hi = [-Infinity, -Infinity, -Infinity];
  for (let k = 0; k < p.length; k++) {
    lo[k % 3] = Math.min(lo[k % 3], p[k]);
    hi[k % 3] = Math.max(hi[k % 3], p[k]);
  }
  return lo.map((v, k) => (v + hi[k]) / 2);
};
const [left, right] = [centre('leftEye'), centre('rightEye')];
writeFileSync(join(out, 'eyes.json'), JSON.stringify({ left, right }));
process.stdout.write(`${join(out, 'head.obj')}\n`);
