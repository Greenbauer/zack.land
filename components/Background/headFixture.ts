import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

import { decodeHead } from './headGeometry';

// What the head's tests (head.test.ts, headExpressions.test.ts) read: the
// built head, as the page reads it, and measures of its skin.

export type Point = [x: number, y: number, z: number];

// public/background/geometry/head.bin, built by scripts/build-head.mjs and
// read as the page reads it (unzipped): the skin's vertices and triangles.
const file = zlib.gunzipSync(
  fs.readFileSync(
    path.join(__dirname, '../../public/background/geometry/head.bin'),
  ),
);
export const { meshes, expressions } = decodeHead(
  file.buffer.slice(file.byteOffset, file.byteOffset + file.byteLength),
);
export const skin = (() => {
  const { positions, indices } = meshes.get('skin')!;
  return {
    vertices: Array.from(
      { length: positions.length / 3 },
      (_, i) => [...positions.subarray(i * 3, i * 3 + 3)] as Point,
    ),
    faces: Array.from({ length: indices.length / 3 }, (_, i) => [
      ...indices.subarray(i * 3, i * 3 + 3),
    ]),
  };
})();

// The join between the head and the body (scripts/build-head.mjs, JOIN).
export const joinY = (z: number) => -38 + ((z + 56) * (-76 + 38)) / (15 + 56);

// How far forward the skin reaches between two heights, near the midline or
// between two distances from it.
export const front = (top: number, bottom: number, from = 0, to = 4) =>
  Math.max(
    ...skin.vertices
      .filter(
        ([x, y]) =>
          Math.abs(x) >= from && Math.abs(x) < to && y <= top && y > bottom,
      )
      .map(([, , z]) => z),
  );

export const openEdges = () => {
  const uses = new Map<string, number>();
  for (const face of skin.faces)
    face.forEach((a, k) => {
      const b = face[(k + 1) % face.length]!;
      const key = a < b ? `${a},${b}` : `${b},${a}`;
      uses.set(key, (uses.get(key) ?? 0) + 1);
    });
  return [...uses].filter(([, count]) => count === 1).map(([key]) => key);
};
