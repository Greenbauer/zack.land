import { describe, expect, it } from 'vitest';

import { isOffLine, placeOf, viewLine } from './useHeldCard';

describe('the line a post crosses to be the one in view', () => {
  it('is the middle of the space between the fades', () => {
    // 1280 by 720: the space runs from 160 to 560, around the window's middle.
    expect(viewLine(160, 400)).toBe(360);
    // A phone on its side, 844 by 390: the space runs from 160 to 192, all
    // above the window's middle (195), where the end of a post laid open
    // taller than the page (at 192) never reached.
    expect(viewLine(160, 32)).toBe(176);
  });
});

const crossing = (isIntersecting: boolean, top: number, bottom: number) => ({
  isIntersecting,
  boundingClientRect: { top, bottom } as DOMRectReadOnly,
});

describe('where a post is', () => {
  it('is the one in view, above it or below it', () => {
    expect(placeOf([crossing(true, 160, 500)], 176)).toBe('current');
    expect(placeOf([crossing(false, -196, 32)], 176)).toBe('before');
    expect(placeOf([crossing(false, 320, 660)], 176)).toBe('after');
  });

  it('is where the last of several crossings brought at once left it', () => {
    // Seen on a busy page: the post wobbled below the line and back within
    // one delivery, and is in view.
    expect(
      placeOf([crossing(false, 191, 531), crossing(true, 139, 479)], 176),
    ).toBe('current');
    expect(
      placeOf([crossing(true, 160, 500), crossing(false, -196, 32)], 176),
    ).toBe('before');
  });
});

describe('a post off the line', () => {
  it('is off once it ends above the line or starts below its band', () => {
    expect(isOffLine(-196, 32, 176)).toBe(true);
    expect(isOffLine(320, 660, 176)).toBe(true);
    expect(isOffLine(160, 500, 176)).toBe(false);
    // At the end of a post laid open taller than the page.
    expect(isOffLine(-36, 192, 176)).toBe(false);
  });
});
