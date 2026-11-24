import { Vector3 } from 'three';

import { meshes } from './headFixture';

// How far inside the head a point is, for the tests of what it wears: past
// the nearest point of its skin, along that point's normal (negative outside;
// -Infinity further than 8 units off). Only the skin above `LOW` counts.
const CELL = 4;
const LOW = -40;
const { positions, normals } = meshes.get('skin')!;
const cellOf = (p: ArrayLike<number>) =>
  [0, 1, 2].map((axis) => Math.floor(p[axis]! / CELL));
const grid = new Map<string, number[]>();
for (let i = 0; i < positions.length; i += 3) {
  if (positions[i + 1]! < LOW) continue;
  const key = cellOf(positions.subarray(i, i + 3)).join();
  const cell = grid.get(key);
  if (cell) cell.push(i);
  else grid.set(key, [i]);
}

const NEAR = [-2, -1, 0, 1, 2];
const CELLS = NEAR.flatMap((a) =>
  NEAR.flatMap((b) => NEAR.map((c) => [a, b, c] as const)),
);

export function headDepth(p: Vector3): number {
  const [x, y, z] = cellOf(p.toArray()) as [number, number, number];
  let best = Infinity;
  let nearest = -1;
  const look = (i: number) => {
    const d =
      (positions[i]! - p.x) ** 2 +
      (positions[i + 1]! - p.y) ** 2 +
      (positions[i + 2]! - p.z) ** 2;
    if (d < best) [best, nearest] = [d, i];
  };
  for (const [a, b, c] of CELLS)
    grid.get([x + a, y + b, z + c].join())?.forEach(look);
  if (nearest < 0) return -Infinity;
  const at = new Vector3().fromArray(positions, nearest);
  const normal = new Vector3().fromArray(normals, nearest);
  return at.sub(p).dot(normal);
}
