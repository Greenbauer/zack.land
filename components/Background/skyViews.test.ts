import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  currentView,
  DARK_SKIES,
  LIGHT_SKIES,
  planSkies,
  STATIONS,
  VIEW_BOUND,
  viewBound,
  viewBoundOff,
} from './skyViews';

const seeded = (seed: number) => () => {
  seed = (seed * 1664525 + 1013904223) % 4294967296;
  return seed / 4294967296;
};
type Sky = (typeof STATIONS)[number];
// Which of the skies a view's station is (each view's carries its own hue).
const which = (station: Sky) =>
  STATIONS.findIndex(({ home }) => home === station.home);
const isDark = (station: Sky) => which(station) >= LIGHT_SKIES.length;

describe('the sky for each view of the site', () => {
  it('never gives two posts in a row the same sky, light and dark in turn', () => {
    for (let seed = 1; seed < 20; seed++) {
      const stationFor = planSkies(seeded(seed));
      for (const page of ['/portfolio/web-apps', '/portfolio/miscellaneous'])
        for (let post = 0; post < 12; post++) {
          const here = stationFor(`${page}#${post}`);
          const next = stationFor(`${page}#${post + 1}`);
          expect(which(next)).not.toBe(which(here));
          expect(isDark(next)).not.toBe(isDark(here));
        }
    }
  });

  it('crosses between light and dark on every change of view, pages included', () => {
    for (let seed = 1; seed < 20; seed++) {
      const stationFor = planSkies(seeded(seed));
      let last = stationFor('/');
      for (const view of ['/contact', '/', '/portfolio/web-apps#0', '/x']) {
        const next = stationFor(view);
        expect(isDark(next)).not.toBe(isDark(last));
        last = next;
      }
    }
  });

  it('moves the sky on a reload too, off the station the last load left', () => {
    for (const left of STATIONS)
      for (let seed = 1; seed < 20; seed++)
        expect(which(planSkies(seeded(seed), left)('/'))).not.toBe(which(left));
  });

  it('moves the sky on every change of view, pages included', () => {
    const random = seeded(7);
    const pages = ['/', '/contact', '/portfolio/web-apps#0', '/no-such-page'];
    for (let seed = 1; seed < 30; seed++) {
      const stationFor = planSkies(seeded(seed));
      let lastView = '/';
      let last = stationFor(lastView);
      for (let k = 0; k < 40; k++) {
        const view = pages[Math.floor(random() * pages.length)]!;
        const station = stationFor(view);
        // The same view, still on screen, keeps its sky; a new view never
        // lands on the sky it is leaving.
        if (view === lastView) expect(station).toBe(last);
        else expect(which(station)).not.toBe(which(last));
        [lastView, last] = [view, station];
      }
    }
  });

  it('keeps a view’s sky while it is on screen, and picks afresh on a later visit', () => {
    const stationFor = planSkies(seeded(3));
    const first = stationFor('/');
    expect(stationFor('/')).toBe(first);
    const visits = Array.from({ length: 20 }, () => {
      stationFor('/contact');
      return which(stationFor('/'));
    });
    expect(new Set(visits).size).toBeGreaterThan(1);
  });

  it('keeps the sky a portfolio page set off with as its first post comes up', () => {
    for (let seed = 1; seed < 20; seed++) {
      const stationFor = planSkies(seeded(seed));
      stationFor('/contact');
      const bound = stationFor('/portfolio/web-apps');
      expect(stationFor('/portfolio/web-apps#0')).toBe(bound);
      expect(stationFor('/portfolio/web-apps#1')).not.toBe(bound);
    }
  });

  it('chooses afresh on each load', () => {
    const views = ['/', '/contact', '/portfolio/web-apps#0'];
    const loads = Array.from({ length: 12 }, (_, seed) => {
      const stationFor = planSkies(seeded(seed + 1));
      return views.map((view) => which(stationFor(view))).join();
    });
    expect(new Set(loads).size).toBeGreaterThan(6);
  });

  it('uses every sky, light and dark, across loads', () => {
    const used = new Set<number>();
    for (let seed = 1; seed < 40; seed++) {
      const stationFor = planSkies(seeded(seed));
      for (let post = 0; post < 8; post++)
        used.add(which(stationFor(`/portfolio/web-apps#${post}`)));
    }
    expect(used.size).toBe(LIGHT_SKIES.length + DARK_SKIES.length);
  });

  it('keeps every reach small: a fraction of a turn either way', () => {
    for (const { reach } of STATIONS) {
      expect(reach.x).toBeLessThanOrEqual(0.2);
      expect(reach.y).toBeLessThanOrEqual(0.35);
    }
  });
});

describe('the view the sky is for', () => {
  const page = (pathname: string, posts = 0, scrollTop = 0) => {
    const list = Array.from({ length: posts }, (_, k) => ({
      getBoundingClientRect: () => ({ top: k * 800 - scrollTop }),
      offsetHeight: 800,
    }));
    const scroller = {
      scrollTop,
      querySelector: () => list[0] ?? null,
      querySelectorAll: () => list,
    };
    vi.stubGlobal('location', { pathname });
    vi.stubGlobal('document', { getElementById: () => scroller });
    vi.stubGlobal('getComputedStyle', () => ({
      getPropertyValue: () => '0',
      minHeight: '800px',
    }));
  };
  const announced = vi.fn();
  vi.stubGlobal('dispatchEvent', announced);
  afterEach(() => {
    announced.mockClear();
    page('/elsewhere');
    currentView();
  });

  it('is the next page from the click, before the page changes', () => {
    page('/contact');
    expect(currentView()).toBe('/contact');
    viewBound('/');
    expect(announced.mock.calls[0]![0].type).toBe(VIEW_BOUND);
    expect(currentView()).toBe('/');
    page('/');
    expect(currentView()).toBe('/');
  });

  it('is the next post from the turn, before the scroll reaches it', () => {
    page('/portfolio/web-apps', 3);
    viewBound('/portfolio/web-apps#1');
    expect(currentView()).toBe('/portfolio/web-apps#1');
    page('/portfolio/web-apps', 3, 800);
    expect(currentView()).toBe('/portfolio/web-apps#1');
    // Landed, it follows the page again.
    page('/portfolio/web-apps', 3, 1600);
    expect(currentView()).toBe('/portfolio/web-apps#2');
  });

  it('lets go when the browser goes back to the page it set off from', () => {
    page('/contact');
    viewBound('/');
    viewBoundOff();
    expect(currentView()).toBe('/contact');
  });

  it('lets go once the site lands on another page than it set off for', () => {
    page('/contact');
    viewBound('/portfolio');
    page('/portfolio/web-apps');
    expect(currentView()).toBe('/portfolio/web-apps');
    page('/contact');
    expect(currentView()).toBe('/contact');
  });
});
