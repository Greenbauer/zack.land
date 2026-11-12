import { describe, expect, it } from 'vitest';

import { expressions, meshes, skin, skinMoves } from './headFixture';
import { seeded } from './seeded';

describe('the tests’ seeded random', () => {
  it('gives the same numbers from the same seed, and others from another', () => {
    const [a, b, c] = [seeded(7), seeded(7), seeded(8)];
    const take = (random: () => number) => Array.from({ length: 5 }, random);
    const first = take(a);
    expect(take(b)).toEqual(first);
    expect(take(c)).not.toEqual(first);
  });

  it('stays between 0 and 1', () => {
    const random = seeded(1);
    for (let k = 0; k < 1000; k++) {
      const r = random();
      expect(r).toBeGreaterThanOrEqual(0);
      expect(r).toBeLessThan(1);
    }
  });
});

describe('an expression’s moves of the skin', () => {
  it('moves the points head.bin lists, by its amounts, and no other', () => {
    const { indices, moves } =
      meshes.get('skin')!.morphs[expressions.indexOf('blink')]!;
    const d = skinMoves('blink');
    expect(d).toHaveLength(skin.vertices.length);
    const listed = new Set(indices);
    const k = 3;
    expect(d[indices[k]!]).toEqual([...moves.subarray(k * 3, k * 3 + 3)]);
    expect(
      d.filter((_, i) => !listed.has(i)).every((m) => m.every((c) => c === 0)),
    ).toBe(true);
  });
});
