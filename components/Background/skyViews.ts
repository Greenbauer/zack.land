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

const shuffled = <T>(list: T[], random: () => number) => {
  const out = [...list];
  for (let k = out.length - 1; k > 0; k--) {
    const j = Math.floor(random() * (k + 1));
    [out[k], out[j]] = [out[j]!, out[k]!];
  }
  return out;
};

// A fresh choice of skies for every view, made with `random`: each page
// starts on a light or a dark sky at random, and its posts take light and
// dark skies in turn, each family in its own random order, so the skies
// differ on every load and two posts in a row never share one.
export function planSkies(random: () => number = Math.random) {
  const pages = new Map<string, Station[]>();
  return (view: string): Station => {
    const [page = '/', post = '0'] = view.split('#');
    let skies = pages.get(page);
    if (!skies) {
      const light = shuffled(LIGHT_SKIES, random);
      const dark = shuffled(DARK_SKIES, random);
      const darkFirst = random() < 0.5;
      skies = Array.from(
        { length: 2 * Math.max(light.length, dark.length) },
        (_, k) =>
          (k % 2 === 0) === darkFirst
            ? dark[Math.floor(k / 2) % dark.length]!
            : light[Math.floor(k / 2) % light.length]!,
      );
      pages.set(page, skies);
    }
    return skies[Number(post) % skies.length]!;
  };
}

// This load's skies (chosen once, as the page opens).
export const stationFor = planSkies();
