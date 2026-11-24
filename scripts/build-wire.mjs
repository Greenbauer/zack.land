// Writes components/Background/files/wire.bin: the band round the seam where
// the scanned head joins the body, retriangulated evenly for the head's
// wireframe (components/Background/wireSeam.ts, where the file's format is).
// Run it again whenever the head is rebuilt (scripts/build-head.mjs):
//
//   node scripts/build-wire.mjs
//
// It imports TypeScript through Node's own type stripping, so it needs Node
// 22.18 or later.

import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

import { decodeHead } from '../components/Background/headGeometry.ts';
import { aboveSeam, BAND, inBand } from '../components/Background/wireSeam.ts';
import { cross, minus } from './head/mesh.mjs';
import { remesh } from './head/remesh.mjs';

const HERE = import.meta.dirname;
const OUT = path.join(HERE, '../components/Background/files/wire.bin');
const unzipped = zlib.gunzipSync(
  fs.readFileSync(path.join(HERE, 'head/head.bin')),
);
const { positions, indices } = decodeHead(
  unzipped.buffer.slice(
    unzipped.byteOffset,
    unzipped.byteOffset + unzipped.byteLength,
  ),
).meshes.get('skin');
const vertices = Array.from({ length: positions.length / 3 }, (_, i) => [
  ...positions.subarray(i * 3, i * 3 + 3),
]);
const band = inBand(positions, indices);
const faces = [];
const outside = [];
for (let t = 0; t < band.length; t++)
  (band[t] ? faces : outside).push([...indices.subarray(t * 3, t * 3 + 3)]);

// How dense the skin's lines are just outside the band, at each point of its
// border, above and below: the length of the sides of the triangles there
// for their area. The band's even triangles are sized to draw as dense as
// the border nearest them, eased from one border to the other.
const inside = new Set(faces.flat());
const sums = new Map();
for (const face of outside) {
  if (!face.some((i) => inside.has(i))) continue;
  const [a, b, c] = face.map((i) => vertices[i]);
  const sides =
    Math.hypot(...minus(a, b)) +
    Math.hypot(...minus(b, c)) +
    Math.hypot(...minus(c, a));
  const area = Math.hypot(...cross(minus(b, a), minus(c, a))) / 2;
  for (const i of face)
    if (inside.has(i)) {
      const sum = sums.get(i) ?? [0, 0];
      sums.set(i, [sum[0] + sides / 2, sum[1] + area]);
    }
}
// Even triangles with sides `long` draw 2 * sqrt(3) / long for their area.
const lengths = new Map(
  [...sums].map(([i, [sides, area]]) => [i, (2 * Math.sqrt(3) * area) / sides]),
);
const middle = (BAND[0] + BAND[1]) / 2;
const border = [...lengths].map(([i, long]) => ({
  at: vertices[i],
  long,
  above: aboveSeam(vertices[i][1], vertices[i][2]) > middle,
}));
// The mean over the few nearest, weighted by how near.
const near = (p, above) => {
  let sum = 0;
  let total = 0;
  for (const each of border) {
    if (each.above !== above) continue;
    const weight = 1 / (25 + Math.hypot(...minus(each.at, p)) ** 2) ** 2;
    sum += each.long * weight;
    total += weight;
  }
  return sum / total;
};
const size = (p) => {
  const t = (aboveSeam(p[1], p[2]) - BAND[0]) / (BAND[1] - BAND[0]);
  const s = Math.min(1, Math.max(0, t));
  const ease = s * s * (3 - 2 * s);
  return near(p, false) * (1 - ease) + near(p, true) * ease;
};

const { places, faces: even } = remesh({ vertices, faces }, size);
const head = new Uint32Array([places.length, even.length]);
const corners = Uint16Array.from(places.flatMap((place) => place.corners));
const weights = Uint16Array.from(
  places.flatMap(({ weights: [a, b] }) =>
    [a, b].map((w) => Math.round(Math.min(1, Math.max(0, w)) * 65535)),
  ),
);
const index = Uint16Array.from(even.flat());
const zipped = zlib.gzipSync(
  Buffer.concat(
    [head, corners, weights, index].map((part) =>
      Buffer.from(part.buffer, part.byteOffset, part.byteLength),
    ),
  ),
  { level: 9 },
);
fs.writeFileSync(OUT, zipped);
process.stdout.write(
  `wire.bin: ${faces.length} triangles made ${even.length}, ${places.length} points, ${zipped.length} bytes\n`,
);
