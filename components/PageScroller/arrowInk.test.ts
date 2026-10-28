import { describe, expect, it } from 'vitest';

import { isWhite } from './arrowInk';

// Relative luminances: the dark head, a light dawn sky, and the middle.
const HEAD = 0.02;
const LIGHT_SKY = 0.5;

describe('isWhite', () => {
  it('goes white over the dark head', () => {
    expect(isWhite([HEAD, HEAD, HEAD], false)).toBe(true);
  });

  it('keeps the card colour over a light sky', () => {
    expect(isWhite([LIGHT_SKY, LIGHT_SKY, LIGHT_SKY], false)).toBe(false);
  });

  it('is not swayed by a few bright lenses over the head', () => {
    expect(isWhite([HEAD, HEAD, HEAD, LIGHT_SKY, LIGHT_SKY], false)).toBe(true);
  });

  it('takes the card colour over a mid sky, where white reads poorly', () => {
    // White against 0.3 is 3:1, under AA.
    expect(isWhite([0.3, 0.29, 0.32], false)).toBe(false);
    expect(isWhite([0.3, 0.29, 0.32], true)).toBe(false);
  });

  it('holds its side near the edge', () => {
    // White against 0.2 is 4.2:1, between the two thresholds.
    expect(isWhite([0.2], true)).toBe(true);
    expect(isWhite([0.2], false)).toBe(false);
  });

  it('keeps its side with nothing read', () => {
    expect(isWhite([], true)).toBe(true);
    expect(isWhite([], false)).toBe(false);
  });
});
