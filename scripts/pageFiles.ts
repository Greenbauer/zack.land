// The page's copies of the scene's files, built from their sources by
// build-page-files.mjs (which runs this through Node's type stripping), and
// checked against what is committed by pageFiles.test.ts.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import zlib from 'node:zlib';

import { LUTCubeLoader } from 'three-stdlib';

const here = path.dirname(fileURLToPath(import.meta.url));
const source = (file: string) => fs.readFileSync(path.join(here, file));

// { file name: bytes } for components/Background/files/, the head keeping
// only the expressions in `keep`.
export function pageFiles(keep: readonly string[]) {
  const { texture3D } = new LUTCubeLoader().parse(
    source('environment/cubicle-99.cube').toString('utf8'),
  );
  return {
    'head.bin': trimHead(source('head/head.bin'), keep),
    'cubicle-99.lut': Buffer.from(
      (texture3D.image as { data: Uint8Array }).data,
    ),
  };
}

const name = (bytes: Buffer, at: number) =>
  bytes.toString('ascii', at, at + 16).split('\0')[0]!;
const even = (n: number) => n + (n % 2);

// The head file (the format components/Background/headGeometry.ts
// describes), gzipped, with only the expressions in `keep`: every mesh as it
// is, and each kept expression's block of moves, byte for byte.
export function trimHead(zipped: Buffer, keep: readonly string[]) {
  const file = zlib.gunzipSync(zipped);
  const meshes = file.readUInt32LE(8);
  const count = file.readUInt32LE(36);
  const all = Array.from({ length: count }, (_, k) => name(file, 40 + k * 16));
  const kept = all.filter((expression) => keep.includes(expression));
  const top = 40 + count * 16;
  // The header: the box and mesh table as they are, the names cut to `kept`.
  const header = Buffer.alloc(40 + kept.length * 16);
  file.copy(header, 0, 0, 36);
  header.writeUInt32LE(kept.length, 36);
  kept.forEach((expression, k) =>
    header.write(expression, 40 + k * 16, 16, 'ascii'),
  );
  const table = file.subarray(top, top + meshes * 24);
  const parts = [header, table];
  let at = top + meshes * 24;
  for (let m = 0; m < meshes; m++) {
    const vertices = table.readUInt32LE(m * 24 + 16);
    const triangles = table.readUInt32LE(m * 24 + 20);
    // Positions, triangles, normals and the two weights, each padded even.
    const fixed =
      vertices * 6 +
      triangles * 6 +
      even(vertices * 3) +
      even(vertices) +
      even(vertices);
    parts.push(file.subarray(at, at + fixed));
    at += fixed;
    for (const expression of all) {
      const block = 4 + file.readUInt32LE(at) * 8;
      if (keep.includes(expression)) parts.push(file.subarray(at, at + block));
      at += block;
    }
  }
  if (at !== file.length) throw new Error('head.bin: not read to its end');
  return zlib.gzipSync(Buffer.concat(parts), { level: 9 });
}
