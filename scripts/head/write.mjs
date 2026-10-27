// Writes head.bin, the format components/Background/headGeometry.ts
// describes and reads, gzipped. `parts` are { name, mesh: { vertices, faces }
// (triangles), normals, weights?, morphs?: { [expression]: per-vertex
// [dx, dy, dz] at full strength } }.

import fs from 'node:fs';
import zlib from 'node:zlib';

// A morph keeps the vertices it moves by more than this (head.bin units).
const MOVED = 0.02;
const POSITION_SCALE = 1000;

const even = (n) => n + (n % 2);

export function writeHead(file, parts, expressions) {
  const all = parts.flatMap(({ mesh }) => mesh.vertices);
  const min = [0, 1, 2].map((axis) =>
    all.reduce((low, v) => Math.min(low, v[axis]), Infinity),
  );
  const max = [0, 1, 2].map((axis) =>
    all.reduce((high, v) => Math.max(high, v[axis]), -Infinity),
  );
  const top = 40 + expressions.length * 16;
  const header = Buffer.alloc(top + parts.length * 24);
  header.write('HEAD', 0, 'ascii');
  header.writeUInt32LE(3, 4);
  header.writeUInt32LE(parts.length, 8);
  [...min, ...max].forEach((c, k) => header.writeFloatLE(c, 12 + k * 4));
  header.writeUInt32LE(expressions.length, 36);
  expressions.forEach((name, k) =>
    header.write(name, 40 + k * 16, 16, 'ascii'),
  );
  const chunks = [header];
  parts.forEach(({ name, mesh, normals, weights, morphs }, k) => {
    const count = mesh.vertices.length;
    if (count > 65535)
      throw new Error(`${name}: too many vertices for 16-bit indices`);
    header.write(name, top + k * 24, 16, 'ascii');
    header.writeUInt32LE(count, top + k * 24 + 16);
    header.writeUInt32LE(mesh.faces.length, top + k * 24 + 20);
    const positions = Buffer.alloc(count * 6);
    mesh.vertices.forEach((v, i) =>
      v.forEach((c, axis) =>
        positions.writeInt16LE(
          Math.round(((c - min[axis]) / (max[axis] - min[axis])) * 65535) -
            32768,
          (i * 3 + axis) * 2,
        ),
      ),
    );
    const indices = Buffer.alloc(mesh.faces.length * 6);
    mesh.faces.forEach((f, i) =>
      f.forEach((index, corner) =>
        indices.writeUInt16LE(index, (i * 3 + corner) * 2),
      ),
    );
    const packed = Buffer.alloc(even(count * 3));
    normals.forEach((n, i) =>
      n.forEach((c, axis) =>
        packed.writeInt8(Math.round(c * 127), i * 3 + axis),
      ),
    );
    const turns = Buffer.alloc(even(count));
    mesh.vertices.forEach((_, i) =>
      turns.writeUInt8(Math.round((weights?.[i] ?? 1) * 255), i),
    );
    chunks.push(positions, indices, packed, turns);
    for (const expression of expressions) {
      const morph = morphs?.[expression];
      const moved = morph
        ? mesh.vertices.flatMap((_, i) =>
            Math.hypot(...morph[i]) > MOVED ? [i] : [],
          )
        : [];
      const block = Buffer.alloc(4 + moved.length * 8);
      block.writeUInt32LE(moved.length, 0);
      moved.forEach((i, m) => {
        block.writeUInt16LE(i, 4 + m * 2);
        morph[i].forEach((c, axis) =>
          block.writeInt16LE(
            Math.round(c * POSITION_SCALE),
            4 + moved.length * 2 + (m * 3 + axis) * 2,
          ),
        );
      });
      chunks.push(block);
    }
  });
  fs.writeFileSync(file, zlib.gzipSync(Buffer.concat(chunks), { level: 9 }));
}
