import { describe, expect, it, vi } from 'vitest';

import { CARDS, findCards } from './glassCards';

// A page of `count` cards, all on screen and showing, counting how often
// each is measured.
function page(count: number) {
  const measured = Array<number>(count).fill(0);
  const cards = measured.map((_, k) => ({
    parentElement: null,
    closest: () => null,
    hasAttribute: () => false,
    getBoundingClientRect: () => {
      measured[k]! += 1;
      return {
        left: 0,
        right: 100,
        top: k * 10,
        bottom: k * 10 + 50,
        width: 100,
        height: 50,
      };
    },
  }));
  vi.stubGlobal('document', { querySelectorAll: () => cards });
  vi.stubGlobal('getComputedStyle', () => ({
    opacity: '1',
    visibility: 'visible',
    borderTopLeftRadius: '24px',
  }));
  const canvas = {
    width: 1000,
    getBoundingClientRect: () => ({
      left: 0,
      top: 0,
      bottom: 1000,
      width: 1000,
    }),
  } as unknown as HTMLCanvasElement;
  return { canvas, measured };
}

describe('finding the cards for the glass', () => {
  it('takes the first CARDS on screen', () => {
    const { canvas } = page(CARDS + 4);
    expect(findCards(canvas)).toHaveLength(CARDS);
  });

  it('measures no card past the limit', () => {
    const { canvas, measured } = page(CARDS + 4);
    findCards(canvas);
    expect(measured.slice(CARDS)).toEqual([0, 0, 0, 0]);
  });
});
