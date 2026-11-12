import { afterEach, describe, expect, it, vi } from 'vitest';

import { seeded } from './seeded';
import {
  currentView,
  DARK_SKIES,
  headLeft,
  headSeen,
  LIGHT_SKIES,
  planSkies,
  SEEN_MS,
  STATIONS,
  turnsOnLeaving,
  VIEW_BOUND,
  viewBound,
  viewBoundOff,
} from './skyViews';

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

  it('lets go when the browser goes back to the page it set off from', () => {
    page('/contact');
    viewBound('/');
    viewBoundOff();
    expect(currentView()).toBe('/contact');
  });

  it('counts as a new view each time the head goes off the window on it', () => {
    page('/contact');
    expect(currentView()).toBe('/contact');
    headLeft();
    expect(announced.mock.calls[0]![0].type).toBe(VIEW_BOUND);
    expect(currentView()).toBe('/contact~1');
    headLeft();
    expect(currentView()).toBe('/contact~2');
    // Another view is itself again, and so is coming back to this one.
    page('/');
    expect(currentView()).toBe('/');
    page('/contact');
    expect(currentView()).toBe('/contact~2');
    headLeft();
    page('/portfolio');
    headLeft();
    expect(currentView()).toBe('/portfolio~1');
  });

  it('turns the sky as the head goes off only after a second in the window at its place on that view', () => {
    let seen = headSeen(null, '/contact', 0, true, false, true);
    expect(turnsOnLeaving(seen, '/contact', SEEN_MS)).toBe(false);
    seen = headSeen(seen, '/contact', SEEN_MS + 1, true, false, true);
    expect(turnsOnLeaving(seen, '/contact', SEEN_MS + 1)).toBe(true);
    // Off the window, it counts afresh when it comes back.
    seen = headSeen(seen, '/contact', 2000, false, false, true);
    expect(headSeen(seen, '/contact', 2100, true, false, true)).toEqual({
      view: '/contact',
      since: 2100,
    });
  });

  it('counts a new view only from when its card shows, however long it takes to come', () => {
    // On the first load, waiting in the mouth, then out of it (the intro's
    // place is the view's own).
    let seen = headSeen(null, '/contact', 0, true, false, false);
    expect(turnsOnLeaving(seen, '/contact', 3000)).toBe(false);
    seen = headSeen(seen, '/contact', 3000, true, false, true);
    expect(turnsOnLeaving(seen, '/contact', 4100)).toBe(true);
    // A link to Web Apps: its card slow to come (CI), then over the head.
    seen = headSeen(seen, '/portfolio/web-apps', 5000, true, false, false);
    seen = headSeen(seen, '/portfolio/web-apps', 8000, true, false, false);
    expect(turnsOnLeaving(seen, '/portfolio/web-apps', 8000)).toBe(false);
    // Its card shows, placing the head off the window: the frame that takes
    // it off can come over a second later on a starved runner.
    seen = headSeen(seen, '/portfolio/web-apps', 8100, true, false, false);
    expect(turnsOnLeaving(seen, '/portfolio/web-apps', 9500)).toBe(false);
  });

  it('behind the phone menu, turns it as the menu closes on its own view, not on a page chosen in it', () => {
    // Opened on /contact, the head (off the window there) on its way back
    // behind the pane, then there for two seconds.
    let seen = headSeen(null, '/contact', 0, false, true, false);
    seen = headSeen(seen, '/contact', 2000, true, true, false);
    expect(turnsOnLeaving(seen, '/contact', 2000)).toBe(true);
    // A link in it to Web Apps, the pane waiting for the page, then the
    // page's card slow to show once the pane has gone (CI).
    seen = headSeen(seen, '/portfolio/web-apps', 2100, true, true, false);
    seen = headSeen(seen, '/portfolio/web-apps', 3900, true, true, false);
    seen = headSeen(seen, '/portfolio/web-apps', 4000, true, false, false);
    seen = headSeen(seen, '/portfolio/web-apps', 6000, true, false, false);
    expect(turnsOnLeaving(seen, '/portfolio/web-apps', 6000)).toBe(false);
    seen = headSeen(seen, '/portfolio/web-apps', 6100, true, false, true);
    expect(turnsOnLeaving(seen, '/portfolio/web-apps', 6100)).toBe(false);
    // Staying in the window there (its card above it), it counts from then.
    seen = headSeen(seen, '/portfolio/web-apps', 7200, true, false, true);
    expect(turnsOnLeaving(seen, '/portfolio/web-apps', 7200)).toBe(true);
  });

  it('turns the sky when the head goes off, as a change of view does', () => {
    const plan = planSkies(() => 0.3);
    const first = plan('/contact');
    expect(plan('/contact')).toBe(first);
    const after = plan('/contact~1');
    expect(LIGHT_SKIES.includes(after)).not.toBe(LIGHT_SKIES.includes(first));
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
