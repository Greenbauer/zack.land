import { describe, expect, it } from 'vitest';

import { CARD_MS, slideAwayTo, TILES_MS, TITLE_MS } from './leaveTo';
import { GO_WAIT_S } from './MediaMelt';
import { MELT_OUT_S, paceOf } from './mediaMelter';

const plain = {
  button: 0,
  metaKey: false,
  ctrlKey: false,
  shiftKey: false,
  altKey: false,
};
const here = 'https://zack.land/';

describe('which link clicks move the page out first', () => {
  it('slides away for a plain click on another page of the site', () => {
    expect(slideAwayTo(plain, { href: '/contact', target: '' }, here)).toBe(
      '/contact',
    );
    expect(
      slideAwayTo(
        plain,
        {
          href: 'https://zack.land/portfolio/web-apps?x=1#top',
          target: '_self',
        },
        here,
      ),
    ).toBe('/portfolio/web-apps?x=1#top');
  });

  it('lets a click with a modifier key or another button go at once', () => {
    for (const key of ['metaKey', 'ctrlKey', 'shiftKey', 'altKey'])
      expect(
        slideAwayTo(
          { ...plain, [key]: true },
          { href: '/contact', target: '' },
          here,
        ),
      ).toBeNull();
    expect(
      slideAwayTo(
        { ...plain, button: 1 },
        { href: '/contact', target: '' },
        here,
      ),
    ).toBeNull();
  });

  it('lets a new tab, another site or this same page go at once', () => {
    expect(
      slideAwayTo(plain, { href: '/contact', target: '_blank' }, here),
    ).toBeNull();
    expect(
      slideAwayTo(plain, { href: 'https://github.com/x', target: '' }, here),
    ).toBeNull();
    expect(slideAwayTo(plain, { href: '/#name', target: '' }, here)).toBeNull();
  });
});

describe("the page's way out", () => {
  it('goes only once the slowest tile has melted out, and the cards have left', () => {
    const slowestOut = GO_WAIT_S + MELT_OUT_S / paceOf(-1, 0);
    expect(TILES_MS / 1000).toBeGreaterThanOrEqual(slowestOut);
    expect(TILES_MS).toBeGreaterThanOrEqual(CARD_MS);
    expect(TILES_MS).toBeGreaterThanOrEqual(TITLE_MS);
  });
});
