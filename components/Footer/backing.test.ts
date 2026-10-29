import { describe, expect, it } from 'vitest';

import { needsBacking } from './backing';

// Relative luminances: the head's dark chest, and a pale dawn sky.
const CHEST = 0.02;
const PALE = 0.45;

describe('the footer text backing', () => {
  it('backs text over both the dark head and the pale sky', () => {
    const mixed = [...Array(20).fill(CHEST), ...Array(20).fill(PALE)];
    expect(needsBacking(mixed, false)).toBe(true);
  });

  it('leaves text over the sky alone, light or dark', () => {
    expect(needsBacking(Array(40).fill(PALE), false)).toBe(false);
    expect(needsBacking(Array(40).fill(0.05), false)).toBe(false);
    // A gently graded sky is not mixed.
    expect(needsBacking([0.3, 0.32, 0.35, 0.38, 0.4], false)).toBe(false);
  });

  it('is not swayed by a few dark or bright points', () => {
    const sky = [...Array(38).fill(PALE), CHEST, CHEST];
    expect(needsBacking(sky, false)).toBe(false);
  });

  it('holds its state near the edge', () => {
    // 0.25 against 0.05 is 2.7:1, between the two thresholds.
    const edge = [...Array(10).fill(0.05), ...Array(10).fill(0.25)];
    expect(needsBacking(edge, true)).toBe(true);
    expect(needsBacking(edge, false)).toBe(false);
    expect(needsBacking([], true)).toBe(true);
  });
});
