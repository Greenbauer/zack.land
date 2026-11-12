import { describe, expect, it } from 'vitest';

import { meshes, openEdges, skin, skinMoves } from './headFixture';

// The eyelids in head.bin's expressions, measured on one eye's rim (the skin's
// open edge round the eye): heights against the line through the eye's
// corners, in head.bin units (about 1.7 mm each). In a real smile the lower
// lid rises and runs nearly straight, just under that line (the reference
// photo); turned up most mid-lid, it arched up past it.

// Each expression's move of a skin point at full strength.
const mover = (name: string) => {
  const d = skinMoves(name);
  return (i: number) => d[i]!;
};

// The left eye's rim, its corners' line, and its lower lid in order across.
const eye = (() => {
  const ball = meshes.get('leftEye')!.positions;
  const n = ball.length / 3;
  const centre = [0, 1, 2].map(
    (a) =>
      Array.from({ length: n }, (_, i) => ball[i * 3 + a]!).reduce(
        (s, c) => s + c,
      ) / n,
  );
  const onRim = new Set(
    openEdges().flatMap((key) => key.split(',').map(Number)),
  );
  const rim = [...onRim].filter((i) => {
    const p = skin.vertices[i]!;
    return Math.hypot(...p.map((c, a) => c - centre[a]!)) < 13 && p[2] > 15;
  });
  const xs = rim.map((i) => skin.vertices[i]![0]);
  const [a, b] = [Math.min(...xs), Math.max(...xs)].map(
    (x) => skin.vertices[rim[xs.indexOf(x)]!]!,
  );
  const line = (x: number) =>
    a![1] + ((x - a![0]) * (b![1] - a![1])) / (b![0] - a![0]);
  const lower = rim
    .filter((i) => skin.vertices[i]![1] < line(skin.vertices[i]![0]))
    .sort((p, q) => skin.vertices[p]![0] - skin.vertices[q]![0]);
  return { line, lower, low: a![0], high: b![0] };
})();

// The lower lid's height under the corners' line at each of its points, with
// `name` at full strength (none: at rest), and the middle half of them.
function lowerLid(name?: string) {
  const move = name ? mover(name) : () => [0, 0, 0];
  return eye.lower.map((i) => {
    const [x, y] = skin.vertices[i]!;
    const d = move(i);
    const t = (x - eye.low) / (eye.high - eye.low);
    return {
      mid: t > 0.25 && t < 0.75,
      height: y + d[1]! - eye.line(x + d[0]!),
    };
  });
}

describe("the head's lower eyelids", () => {
  const rest = lowerLid();
  for (const name of ['smile', 'squint'])
    it(`rise into a straight line just under the eye's corners as it makes a ${name}`, () => {
      const lid = lowerLid(name);
      // Never up past the corners' line, as an arch.
      for (const { height } of lid) expect(height).toBeLessThan(0);
      // Straight through its middle.
      const middle = lid.filter((p) => p.mid).map((p) => p.height);
      expect(Math.max(...middle) - Math.min(...middle)).toBeLessThan(0.35);
      // And it still narrows the eye from below.
      const deepest = Math.min(...rest.map((p) => p.height));
      expect(Math.min(...middle)).toBeGreaterThan(deepest + 1.2);
    });
});
