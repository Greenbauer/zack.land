import { describe, expect, it } from 'vitest';

import { expressions, meshes } from './headFixture';
import { SHOWN_SIDED } from './shownExpressions';
import { sideWeight, withSides } from './sideMorphs';

// The expressions the page splits, and the shrug, whose halves blend across
// the whole neck.
const SIDED = [...SHOWN_SIDED, 'shrug'];

describe("the head's one-sided expressions", () => {
  const head = withSides({ meshes, expressions }, SIDED);
  const skin = head.meshes.get('skin')!;
  const morph = (name: string) => skin.morphs[head.expressions.indexOf(name)]!;
  // The total move, by side of the face (+x is the head's own left).
  const sideMoves = (name: string) => {
    const { indices, moves } = morph(name);
    let left = 0;
    let right = 0;
    indices.forEach((v, k) => {
      const size = Math.hypot(
        moves[k * 3]!,
        moves[k * 3 + 1]!,
        moves[k * 3 + 2]!,
      );
      // Clear of the blend across the middle (sideMorphs.ts: 6 either side
      // of -0.7, 22 for the shrug).
      const clear = name.startsWith('shrug') ? 22 : 6;
      if (skin.positions[v * 3]! > -0.7 + clear) left += size;
      if (skin.positions[v * 3]! < -0.7 - clear) right += size;
    });
    return { left, right };
  };

  it('adds a left and a right half of each split expression, after the rest', () => {
    expect(head.expressions.slice(0, expressions.length)).toEqual(expressions);
    expect(head.expressions.slice(expressions.length)).toEqual(
      SIDED.flatMap((name) => [`${name}Left`, `${name}Right`]),
    );
    for (const part of head.meshes.values())
      expect(part.morphs).toHaveLength(head.expressions.length);
  });

  it('moves only its own side, well clear of the middle', () => {
    for (const name of SIDED) {
      const left = sideMoves(`${name}Left`);
      const right = sideMoves(`${name}Right`);
      expect(left.left).toBeGreaterThan(0);
      expect(left.right).toBe(0);
      expect(right.right).toBeGreaterThan(0);
      expect(right.left).toBe(0);
    }
  });

  it('adds its halves up to the whole expression', () => {
    for (const name of SIDED) {
      const whole = morph(name).moves;
      const left = morph(`${name}Left`).moves;
      const right = morph(`${name}Right`).moves;
      whole.forEach((m, k) => expect(left[k]! + right[k]!).toBeCloseTo(m, 5));
    }
  });

  it('blends across the middle of the face', () => {
    expect(sideWeight(-0.7, 'Left')).toBeCloseTo(0.5);
    expect(sideWeight(5.3, 'Left')).toBe(1);
    expect(sideWeight(-6.7, 'Right')).toBe(1);
    expect(sideWeight(21.3, 'Left', 'shrug')).toBe(1);
    expect(sideWeight(5.3, 'Left', 'shrug')).toBeLessThan(1);
  });
});
