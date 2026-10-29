import { describe, expect, it } from 'vitest';

import { contrastRatio, relativeLuminance } from './backdrop';

describe('keeping text readable over the turning sky', () => {
  it('measures luminance and contrast as WCAG does', () => {
    expect(relativeLuminance(255, 255, 255)).toBeCloseTo(1);
    expect(relativeLuminance(0, 0, 0)).toBe(0);
    expect(relativeLuminance(119, 119, 119)).toBeCloseTo(0.184, 3);
    expect(contrastRatio(1, 0)).toBeCloseTo(21);
  });
});
