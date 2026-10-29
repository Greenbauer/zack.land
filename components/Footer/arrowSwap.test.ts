import { describe, expect, it } from 'vitest';

import { SWAP_MS, swapTo } from './arrowSwap';

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
