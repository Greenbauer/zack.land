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
function viewOnScreen(): string {
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

// The view the site has set off for, ahead of its arrival: a page whose link
// was just clicked, which comes up only once the page has moved out. (A post
// turned to needs none: the sky sets off as the scroll reaches it.) The sky
// sets off for it at once (Sky.tsx, on VIEW_BOUND). It lasts until that view
// is on screen or the site is on another page.
export const VIEW_BOUND = 'sky-view-bound';
let bound: { from: string; to: string } | null = null;
export function viewBound(to: string) {
  bound = { from: location.pathname, to };
  dispatchEvent(new Event(VIEW_BOUND));
}
// The browser's back and forward go where they go, whatever the site had set
// off for.
export const viewBoundOff = () => {
  bound = null;
};

// The view the sky is for: the one the site has set off for, or else the one
// on screen.
export function currentView(): string {
  const shown = viewOnScreen();
  if (bound?.from === location.pathname && bound.to !== shown) return bound.to;
  bound = null;
  return shown;
}

// A fresh sky for every view of the site, picked with `random`: each time
// the view changes (another page, or another post of a portfolio page) the
// sky moves to a station picked at random from the other side, light for
// dark or dark for light: the stations on one side lie close together, so a
// move within it hardly shows, and a move across goes well round the sky. The
// first view takes either side. A view asked again while it is on screen keeps
// its sky, and a view come back to later gets a new one, so the skies differ
// on every load and on every visit. A page's first post is that page's view, so a
// portfolio page set off for (viewBound) keeps its sky as its first post comes
// up. `left` is the station the last load of the tab ended on, so a reload
// moves the sky too.
export function planSkies(
  random: () => number = Math.random,
  left: Station | null = null,
) {
  let view: string | null = null;
  let station: Station | null = left;
  return (next: string): Station => {
    if (station && (next === view || next === `${view}#0`)) {
      view = next;
      return station;
    }
    const family = station
      ? LIGHT_SKIES.includes(station)
        ? DARK_SKIES
        : LIGHT_SKIES
      : random() < 0.5
        ? LIGHT_SKIES
        : DARK_SKIES;
    station = family[Math.floor(random() * family.length)]!;
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
