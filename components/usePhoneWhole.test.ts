import { describe, expect, it } from 'vitest';

import { collage } from './collageLayout';
import { keepsImages } from './usePhoneWhole';

describe("whether a phone's card can show whole", () => {
  const seeds = (n: number) => Array.from({ length: n }, (_, k) => `${k}`);

  it('does when its images are held by the width, losing nothing', () => {
    // One square, 500 wide, in a box 700 tall: 150 more for the card costs
    // it nothing.
    expect(keepsImages((h) => collage([1], seeds(1), 500, h), 700, 150)).toBe(
      true,
    );
  });

  it('does not when the card would shrink them', () => {
    // A wide video and two squares in a box 390 by 320: the box's height
    // holds them, so 150 for the card shrinks them.
    expect(
      keepsImages(
        (h) => collage([16 / 9, 1, 1], seeds(3), 390, h, 0),
        320,
        150,
      ),
    ).toBe(false);
  });

  it('does not for no images', () => {
    expect(keepsImages(() => [], 700, 0)).toBe(false);
  });
});
