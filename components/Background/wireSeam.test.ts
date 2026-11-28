import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

import { BufferAttribute, BufferGeometry, Vector3 } from 'three';
import { describe, expect, it } from 'vitest';

import { meshes } from './headFixture';
import { aboveSeam, BAND, decodePatch, inBand, wireParts } from './wireSeam';

const { positions, indices } = meshes.get('skin')!;
const zipped = zlib.gunzipSync(
  fs.readFileSync(path.join(__dirname, 'files/wire.bin')),
);
const patch = decodePatch(
  zipped.buffer.slice(
    zipped.byteOffset,
    zipped.byteOffset + zipped.byteLength,
  ) as ArrayBuffer,
);
const skin = new BufferGeometry();
skin.setAttribute('position', new BufferAttribute(positions, 3));
skin.setIndex(new BufferAttribute(indices, 1));
skin.morphAttributes.position = [new BufferAttribute(positions, 3)];
const { rest, band } = wireParts(skin, patch);

// A geometry's edges: how many triangles each is on, by its ends' places.
const edgesOf = (geometry: BufferGeometry) => {
  const index = geometry.getIndex()!.array;
  const position = geometry.getAttribute('position');
  const at = (i: number) =>
    [position.getX(i), position.getY(i), position.getZ(i)]
      .map((c) => c.toFixed(2))
      .join();
  const edges = new Map<string, number>();
  for (let t = 0; t < index.length; t += 3)
    for (let k = 0; k < 3; k++) {
      const key = [at(index[t + k]!), at(index[t + ((k + 1) % 3)]!)]
        .sort()
        .join('|');
      edges.set(key, (edges.get(key) ?? 0) + 1);
    }
  return edges;
};

// How closely lines are drawn at each height above the seam, in bands of 2
// units round it: their length for the area they are drawn on.
function density(geometries: BufferGeometry[]) {
  const out = new Map<number, { long: number; area: number }>();
  const [a, b, c] = [new Vector3(), new Vector3(), new Vector3()];
  for (const geometry of geometries) {
    const index = geometry.getIndex()!.array;
    const position = geometry.getAttribute('position');
    for (let t = 0; t < index.length; t += 3) {
      [a, b, c].forEach((v, k) =>
        v.fromBufferAttribute(position, index[t + k]!),
      );
      const key = Math.round(
        aboveSeam((a.y + b.y + c.y) / 3, (a.z + b.z + c.z) / 3) / 2,
      );
      const sum = out.get(key) ?? { long: 0, area: 0 };
      sum.long += (a.distanceTo(b) + b.distanceTo(c) + c.distanceTo(a)) / 2;
      sum.area += b.clone().sub(a).cross(c.clone().sub(a)).length() / 2;
      out.set(key, sum);
    }
  }
  return (key: number) => out.get(key)!.long / out.get(key)!.area;
}

describe("the wireframe's band round the neck", () => {
  it('was crowded at the seam: that was the line', () => {
    const before = density([skin]);
    expect(before(-1)).toBeGreaterThan(1.4 * before(-5));
  });

  it('is drawn evenly, no line and no gap: no step in how close its lines are', () => {
    const after = density([rest, band]);
    for (let key = -30; key <= 8; key++) {
      const step = after(key) / after(key - 1);
      expect(step, `${key}`).toBeGreaterThan(0.93);
      expect(step, `${key}`).toBeLessThan(1.08);
    }
  });

  it('is in date with the head: meets the rest of it all the way round', () => {
    // Run `node scripts/build-wire.mjs` when the head is rebuilt.
    const inner = [...edgesOf(band)].filter(([, on]) => on === 1);
    const outer = edgesOf(rest);
    const open = [...edgesOf(skin)].filter(([, on]) => on === 1);
    const ends = new Set(open.map(([key]) => key));
    expect(inner.length).toBeGreaterThan(100);
    for (const [key] of inner)
      expect(outer.has(key) || ends.has(key)).toBe(true);
  });

  it('is only the skin near the seam: the rest of the head is its own', () => {
    const own = inBand(positions, indices).filter(Boolean).length;
    expect(rest.getIndex()!.count).toBe(indices.length - own * 3);
    const position = band.getAttribute('position');
    for (let i = 0; i < position.count; i++) {
      const above = aboveSeam(position.getY(i), position.getZ(i));
      expect(above).toBeGreaterThan(BAND[0] - 1);
      expect(above).toBeLessThan(BAND[1] + 1);
    }
  });

  it('keeps every skin attribute and expression', () => {
    expect(band.morphAttributes.position).toHaveLength(1);
    expect(band.morphAttributes.position![0]!.count).toBe(
      band.getAttribute('position').count,
    );
  });
});
