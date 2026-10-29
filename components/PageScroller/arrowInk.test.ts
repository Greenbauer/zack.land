import { describe, expect, it } from 'vitest';

import { isLight } from './arrowInk';

// Relative luminances: the dark head, a light dawn sky, and the middle.
const HEAD = 0.02;
const LIGHT_SKY = 0.5;

describe('isLight', () => {
  // The theme's light (#ede4e3) has a luminance of about 0.79.
  it('goes light over the dark head', () => {
    expect(isLight([HEAD, HEAD, HEAD], false)).toBe(true);
  });

  it('keeps the card colour over a light sky', () => {
    expect(isLight([LIGHT_SKY, LIGHT_SKY, LIGHT_SKY], false)).toBe(false);
  });

  it('is not swayed by a few bright lenses over the head', () => {
    expect(isLight([HEAD, HEAD, HEAD, LIGHT_SKY, LIGHT_SKY], false)).toBe(true);
  });

  it('takes the card colour over a mid sky, where the light reads poorly', () => {
    // The light against 0.3 is 2.4:1, under AA.
    expect(isLight([0.3, 0.29, 0.32], false)).toBe(false);
    expect(isLight([0.3, 0.29, 0.32], true)).toBe(false);
  });

  it('holds its side near the edge', () => {
    // The light against 0.15 is 4.2:1, between the two thresholds.
    expect(isLight([0.15], true)).toBe(true);
    expect(isLight([0.15], false)).toBe(false);
  });

  it('keeps its side with nothing read', () => {
    expect(isLight([], true)).toBe(true);
    expect(isLight([], false)).toBe(false);
  });
});
