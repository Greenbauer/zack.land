import { describe, expect, it } from 'vitest';

import { collage } from './collageLayout';
import { frameChanged, keepsImages } from './usePhoneWhole';

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

describe("when a phone's card is tried again", () => {
  const frame = { width: 366, height: 610 };

  it('is tried the first time', () => {
    expect(frameChanged(null, frame)).toBe(true);
  });

  it("is not tried again when only the post's padding changes", () => {
    // Showing the card whole changes the post's bottom padding (the card's
    // height) and not its whole box; re-trying on that flipped the card
    // short and whole forever.
    expect(frameChanged(frame, { ...frame })).toBe(false);
  });

  it('is tried again when the post narrows or widens', () => {
    expect(frameChanged(frame, { ...frame, width: 390 })).toBe(true);
  });

  it('is tried again when the post grows or shrinks in height', () => {
    // The window's height changing, or the footer shrinking to its scroll
    // arrow alone, changes --post-height.
    expect(frameChanged(frame, { ...frame, height: 680 })).toBe(true);
  });
});
