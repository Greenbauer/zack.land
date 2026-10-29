import { postSpans } from '@/components/PageScroller/pageGlide';

// Where the sky sits for each view of the site: each page, and each post of
// the portfolio pages, turns the sky to its own home (a station), so every
// view shows a different part of the dawn, and the pointer only turns it a
// little from there (`reach`), never so far that the text over it would
// switch between light and dark. The stations and their reaches were picked
// by measuring the sky as the site draws it (the dawn's sun glow, its upper
// sky, the land under the horizon), each one wholly on the light side or the
// dark side of where text switches (components/SkyText/skyColours.ts's
// CROSSOVER), with room to spare across its reach.

// A turn of the sky, in radians: x tips it, y turns it (Sky.tsx).
export type Turn = { x: number; y: number };
export type Station = { home: Turn; reach: Turn };

// Measured on the contact page at 1440 by 900 (the sky's brightness behind
// the header links and title, the footer text and the card, at the home and
// with the pointer in each corner): the light ones stay above 0.17 where text
// switches to light below 0.116, the dark ones below 0.17 where it switches
// to dark above 0.196. Only these two families keep text readable (AA's 4.5:1)
// for one colour or the other: the dawn's mid tones, its blue-lavender, lie
// between, where neither light nor dark text reads well enough. The palest
// spots (the sun glow and the sky beside it, near white) are left out.
const REACH = { x: 0.2, y: 0.35 };
// Light skies, dark text: lavender above the sunrise.
export const LIGHT_SKIES: Station[] = [
  { home: { x: -0.8, y: 2.36 }, reach: REACH },
  { home: { x: -0.8, y: 1.83 }, reach: REACH },
  { home: { x: -0.6, y: 2.62 }, reach: REACH },
];
// Dark skies, light text: the land under the horizon.
export const DARK_SKIES: Station[] = [
  { home: { x: 0.8, y: -1.57 }, reach: REACH },
  { home: { x: 0.8, y: -0.52 }, reach: REACH },
  { home: { x: 0.8, y: -2.09 }, reach: REACH },
  { home: { x: 0.6, y: -1.05 }, reach: REACH },
];
export const STATIONS = [...LIGHT_SKIES, ...DARK_SKIES];

// The view on screen: the page, and on a portfolio page the post in view.
export function currentView(): string {
  const page = location.pathname;
  const scroller = document.getElementById('page');
  if (!scroller?.querySelector('[data-post]')) return page;
  const spans = postSpans(scroller);
  const at = scroller.scrollTop;
  let nearest = 0;
  spans.forEach(([start, end], k) => {
    const gap = (s: [number, number]) =>
      at < s[0] ? s[0] - at : at > s[1] ? at - s[1] : 0;
    if (gap([start, end]) < gap(spans[nearest]!)) nearest = k;
  });
  return `${page}#${nearest}`;
}

// A fresh sky for every view of the site, picked with `random`: each time
// the view changes (another page, or another post of a portfolio page) the
// sky moves to a station picked at random, never the one it is leaving.
// Between the posts of one page light and dark skies take turns; a page
// starts on either. A view asked again while it is on screen keeps its sky,
// and a view come back to later gets a new one, so the skies differ on every
// load and on every visit. `left` is the station the last load of the tab
// ended on, so a reload moves the sky too.
export function planSkies(
  random: () => number = Math.random,
  left: Station | null = null,
) {
  let view: string | null = null;
  let station: Station | null = left;
  return (next: string): Station => {
    if (next === view && station) return station;
    const samePage = view !== null && view.split('#')[0] === next.split('#')[0];
    const wasLight = station !== null && LIGHT_SKIES.includes(station);
    const family =
      samePage && station
        ? wasLight
          ? DARK_SKIES
          : LIGHT_SKIES
        : random() < 0.5
          ? LIGHT_SKIES
          : DARK_SKIES;
    const choices = family.filter((s) => s !== station);
    station = choices[Math.floor(random() * choices.length)]!;
    view = next;
    return station;
  };
}

// The tab's last station, kept for its next load (sessionStorage, which a
// private window or blocked storage may refuse: then a reload is a fresh
// pick, as a first load is).
const LAST_SKY = 'sky-station';
function lastStation(): Station | null {
  try {
    return STATIONS[Number(sessionStorage.getItem(LAST_SKY) ?? NaN)] ?? null;
  } catch {
    return null;
  }
}

// The skies for this visit to the site, each remembered for a reload.
let plan: ReturnType<typeof planSkies> | undefined;
export function stationFor(view: string): Station {
  plan ??= planSkies(Math.random, lastStation());
  const station = plan(view);
  try {
    sessionStorage.setItem(LAST_SKY, String(STATIONS.indexOf(station)));
  } catch {}
  return station;
}
