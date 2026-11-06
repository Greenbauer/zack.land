import { describe, expect, it } from 'vitest';

import { expressions, meshes, openEdges, Point, skin } from './headFixture';

// Stripes: narrow ridges right beside narrow grooves that an expression
// carves into the skin, which read as wrinkles or cut lines no real face
// makes (the sneer's and the smile's between the nose and the mouth, as
// first built). Measured as how much the skin's bend changes from point to
// point, past what changes smoothly over a centimetre or so.

const neighbours = (() => {
  const sets = skin.vertices.map(() => new Set<number>());
  for (const [a, b, c] of skin.faces as [number, number, number][]) {
    sets[a]!.add(b).add(c);
    sets[b]!.add(a).add(c);
    sets[c]!.add(a).add(b);
  }
  return sets.map((s) => [...s]);
})();

// How far each point sits below the average of its neighbours, along its
// normal, over the square of their spacing: positive in a groove.
const bend = (p: Point[]) => {
  const normal = p.map(() => [0, 0, 0]);
  for (const [a, b, c] of skin.faces as [number, number, number][]) {
    const u = p[b]!.map((x, k) => x - p[a]![k]!);
    const w = p[c]!.map((x, k) => x - p[a]![k]!);
    const n = [
      u[1]! * w[2]! - u[2]! * w[1]!,
      u[2]! * w[0]! - u[0]! * w[2]!,
      u[0]! * w[1]! - u[1]! * w[0]!,
    ];
    for (const i of [a, b, c])
      for (let k = 0; k < 3; k++) normal[i]![k]! += n[k]!;
  }
  return p.map((q, i) => {
    const near = neighbours[i]!;
    if (!near.length) return 0;
    const mean = [0, 1, 2].map(
      (k) => near.reduce((s, j) => s + p[j]![k]!, 0) / near.length,
    );
    const spacing =
      near.reduce(
        (s, j) => s + Math.hypot(...p[j]!.map((x, k) => x - q[k]!)),
        0,
      ) / near.length;
    const n = normal[i]!;
    const l = Math.hypot(...n) || 1;
    return (
      ((mean[0]! - q[0]) * n[0]! +
        (mean[1]! - q[1]) * n[1]! +
        (mean[2]! - q[2]) * n[2]!) /
      l /
      (spacing * spacing || 1)
    );
  });
};
const evened = (f: number[], passes: number) => {
  let a = f;
  for (let p = 0; p < passes; p++)
    a = a.map((x, i) => {
      const near = neighbours[i]!;
      return near.length
        ? 0.5 * x + (0.5 * near.reduce((s, j) => s + a[j]!, 0)) / near.length
        : x;
    });
  return a;
};
const rest = bend(skin.vertices);
// The cheeks and the skin between the nose and the mouth, clear of the lips'
// and lids' edges (which do bend sharply).
const onEdge = new Set(
  openEdges().flatMap((key) => key.split(',').map(Number)),
);
const edges = skin.vertices.filter(
  ([, y, z], i) => onEdge.has(i) && z > 10 && y > -60 && y < 20,
);
const cheeks = skin.vertices.flatMap(([x, y, z], i) =>
  z > 10 &&
  y > -50 &&
  y < -12 &&
  Math.abs(x) > 4 &&
  Math.abs(x) < 40 &&
  edges.every((e) => Math.hypot(e[0] - x, e[1] - y, e[2] - z) > 4)
    ? [i]
    : [],
);
const stripes = (name: string) => {
  const { indices, moves } =
    meshes.get('skin')!.morphs[expressions.indexOf(name)]!;
  const posed = skin.vertices.map((v) => [...v] as Point);
  indices.forEach((v, k) => {
    for (let a = 0; a < 3; a++) posed[v]![a]! += moves[k * 3 + a]!;
  });
  const change = bend(posed).map((b, i) => b - rest[i]!);
  const smooth = evened(change, 12);
  const fine = cheeks.map((i) => change[i]! - smooth[i]!);
  return 1000 * Math.sqrt(fine.reduce((s, x) => s + x * x, 0) / fine.length);
};

describe('the head’s expressions', () => {
  it('carve no stripes between the nose and the mouth', () => {
    // As first built the sneer scored 18 here, the nostril flare 17 and the
    // smile and the grimace 14 (narrow folds, the nose's wing lifted 9 mm on
    // its own or swung out 34 degrees on a narrow hinge); soft folds and
    // broad, smaller moves score about 6 to 11.
    for (const name of ['sneer', 'smile', 'lipStretch', 'noseFlare'])
      expect(stripes(name)).toBeLessThan(12);
  }, 60_000);
});
