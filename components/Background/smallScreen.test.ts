import { describe, expect, it } from 'vitest';

import { isSmall } from './smallScreen';

describe('a small window', () => {
  it('is a phone, or a screen too short for much text', () => {
    expect(isSmall(375, 812)).toBe(true);
    expect(isSmall(1280, 560)).toBe(true);
  });

  it('is not a tablet or larger with room to read', () => {
    expect(isSmall(768, 1024)).toBe(false);
    expect(isSmall(1440, 900)).toBe(false);
  });
});
