import { describe, expect, it } from 'vitest';

import { contrastRatio, readableText, relativeLuminance } from './backdrop';

const WHITE: [number, number, number] = [255, 255, 255];
const SKIN: [number, number, number] = [14, 12, 32];

describe('keeping text readable over the turning sky', () => {
  it('measures luminance and contrast as WCAG does', () => {
    expect(relativeLuminance(255, 255, 255)).toBeCloseTo(1);
    expect(relativeLuminance(0, 0, 0)).toBe(0);
    expect(relativeLuminance(119, 119, 119)).toBeCloseTo(0.184, 3);
    expect(contrastRatio(1, 0)).toBeCloseTo(21);
  });

  it('keeps the subtitle white wherever white is readable', () => {
    for (const sky of [0, 0.09, 0.15, 0.18])
      expect(readableText(sky, 4.5, WHITE, SKIN)).toEqual(WHITE);
  });

  it('darkens it only as far as needed over a light sky', () => {
    for (const sky of [0.3, 0.5, 0.71, 0.9]) {
      const text = relativeLuminance(...readableText(sky, 4.5, WHITE, SKIN));
      expect(contrastRatio(text, sky)).toBeGreaterThanOrEqual(4.45);
      // No darker than that: a step lighter would fall short.
      expect(contrastRatio(text * 1.08, sky)).toBeLessThan(4.5);
    }
  });

  it('picks the closer of white and dark where neither reaches 4.5:1', () => {
    // Between about 0.183 and 0.193 neither extreme reaches it alone; white
    // comes closer up to about 0.188, the dark after.
    expect(readableText(0.185, 4.5, WHITE, SKIN)).toEqual(WHITE);
    expect(readableText(0.192, 4.5, WHITE, SKIN)).toEqual(SKIN);
    for (const sky of [0.185, 0.192])
      expect(
        contrastRatio(
          relativeLuminance(...readableText(sky, 4.5, WHITE, SKIN)),
          sky,
        ),
      ).toBeGreaterThan(4.3);
  });
});
