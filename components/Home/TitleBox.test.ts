import { describe, expect, it } from 'vitest';

import { slideAwayTo } from './TitleBox';

const plain = {
  button: 0,
  metaKey: false,
  ctrlKey: false,
  shiftKey: false,
  altKey: false,
};
const here = 'https://zack.land/';

describe('which link clicks slide the home title away first', () => {
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
