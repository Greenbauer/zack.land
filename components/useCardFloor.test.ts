import { describe, expect, it } from 'vitest';

import { isTooShortFor, MIN_PHOTOS_PX, textFloor } from './useCardFloor';

describe('isTooShortFor', () => {
  it('lays a card open whose photos would be only a strip', () => {
    // 900 by 560: a 202 px post, a 160 px floor, photos left 42 px.
    expect(isTooShortFor(160, 202, true)).toBe(true);
  });

  it('keeps a card closed whose photos keep more than a strip', () => {
    // 1024 by 640: a 290 px post, a 212 px floor, photos left 78 px.
    expect(isTooShortFor(212, 290, true)).toBe(false);
    expect(isTooShortFor(200, 200 + MIN_PHOTOS_PX, true)).toBe(false);
  });

  it('lays a card with no photos open only when the card itself does not fit', () => {
    expect(isTooShortFor(228, 228, false)).toBe(false);
    expect(isTooShortFor(228, 200, false)).toBe(true);
  });
});

describe('textFloor', () => {
  // A wide card's text column: its title (36 px), one line (24 px) and More
  // (20 px), 16 px apart.
  it('is the same with More shown as with it taken away', () => {
    expect(textFloor([36, 24, 'more'], 16, 20)).toBe(
      textFloor([36, 24], 16, 20),
    );
    expect(textFloor([36, 24, 'more'], 16, 20)).toBe(36 + 16 + 24 + 16 + 20);
  });

  it('keeps that room for a card with only a title and a line', () => {
    expect(textFloor([36, 24], 16, 20)).toBe(112);
  });
});
