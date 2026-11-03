import { describe, expect, it } from 'vitest';

import { goesStraight, SWAP_MS, swapTo } from './arrowSwap';

describe("the footer's text and the scroll arrow taking turns", () => {
  it('fades the text out before the arrow comes in', () => {
    expect(swapTo('text', true)).toEqual({
      now: 'leaving',
      then: 'arrow',
      after: SWAP_MS,
    });
  });

  it('brings the text back when the arrow leaves, at any point', () => {
    for (const phase of ['arrow', 'leaving'] as const)
      expect(swapTo(phase, false)).toEqual({
        now: 'returning',
        then: 'text',
        after: 0,
      });
  });

  it('turns back to the arrow if it returns as the text comes back', () => {
    expect(swapTo('returning', true).now).toBe('leaving');
  });

  it('stays put when nothing changes', () => {
    expect(swapTo('text', false)).toEqual({ now: 'text' });
    expect(swapTo('arrow', true)).toEqual({ now: 'arrow' });
    expect(swapTo('leaving', true)).toEqual({ now: 'leaving' });
  });
});

describe('when the arrow takes the footer at once', () => {
  it('does while the site is still loading', () => {
    for (const isPhone of [true, false])
      for (const isFirstOnPage of [true, false])
        expect(goesStraight({ isPageIn: false, isPhone, isFirstOnPage })).toBe(
          true,
        );
  });

  // A slow load sets data-page-in before the arrow comes: fading then put
  // the footer's shrinking after the images had come to rest.
  it('does on a phone as a page opens, though it is already in', () => {
    expect(
      goesStraight({ isPageIn: true, isPhone: true, isFirstOnPage: true }),
    ).toBe(true);
  });

  it('fades once the page is in, coming back later or on a wide screen', () => {
    expect(
      goesStraight({ isPageIn: true, isPhone: true, isFirstOnPage: false }),
    ).toBe(false);
    expect(
      goesStraight({ isPageIn: true, isPhone: false, isFirstOnPage: true }),
    ).toBe(false);
  });
});
