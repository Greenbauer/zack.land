import { describe, expect, it } from 'vitest';

import { renderQuality } from './quality';

describe('how finely the scene is drawn', () => {
  it('draws a phone at up to 1.5 pixels per CSS pixel, unsmoothed', () => {
    // An iPhone 13 Pro, upright and on its side.
    for (const [width, height] of [
      [390, 844],
      [844, 390],
    ])
      expect(renderQuality(width!, height!)).toEqual({
        dpr: [1, 1.5],
        samples: 0,
      });
  });

  it('draws a larger screen at up to 2, with 4 samples', () => {
    expect(renderQuality(1440, 900)).toEqual({ dpr: [1, 2], samples: 4 });
  });
});
