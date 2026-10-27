import {
  CELL_PX,
  FEATHER_FROM,
  FEATHER_TO,
  FIELD_FROST_PX,
  FIELD_LENS,
  FROST_PX,
  SPREAD_PX,
} from './glass';
import { BRIGHTEST, DIMMEST } from './glassTint';

// The glass over the photos under a card. The card's glass is drawn in the
// 3D scene (glass.ts), which cannot see the page's photos (the image tiles
// of a post, components/PostCollage.tsx), so over them the same glass is laid
// with a CSS backdrop-filter instead: an SVG filter of the scene's frost and
// lenses, the lenses the same size and laid from the same corner as the
// scene's (so the two meet seamlessly), on a layer behind the card's text
// (the card's ::before, styles/globals.css, which feathers its edges). It
// also keeps the photos within the card's brightness bounds
// (glassTint.ts), dark side or light, so the text over them keeps 4.5:1.
// It is on only while a photo lies under the card.

const SVG = 'http://www.w3.org/2000/svg';
// The lens map is drawn at this resolution and stretched to each lens.
const MAP_PX = 64;

const toSrgb = (l: number) =>
  l <= 0.0031308 ? 12.92 * l : 1.055 * l ** (1 / 2.4) - 0.055;

// A colour channel's limit for a luminance bound: every channel at most (or
// at least) this keeps the luminance there.
const DARK_CAP = toSrgb(BRIGHTEST);
const LIGHT_FLOOR = toSrgb(DIMMEST);

// The values of a transfer table that holds a channel to at most `cap` (dark
// side) or at least `floor` (light side), changing nothing else.
export function boundTable(side: 'dark' | 'light', steps = 16) {
  return Array.from({ length: steps + 1 }, (_, k) => {
    const v = k / steps;
    return side === 'dark' ? Math.min(v, DARK_CAP) : Math.max(v, LIGHT_FLOOR);
  });
}

// How far a lens moves what it shows, in CSS pixels, for feDisplacementMap's
// scale: a lens shows the view SPREAD_PX either side of its centre, so a
// point `cell` / 2 off centre shows the point SPREAD_PX the other way.
export const displacement = (cell: number) => 2 * (SPREAD_PX + cell / 2);

// One lens's map, as a data URL: red the horizontal shift and green the
// vertical (0.5 none), each a straight ramp from one side of the lens to
// the other, so each lens shows the view about its centre upside down.
let lensMap: string | undefined;
function map() {
  if (lensMap) return lensMap;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = MAP_PX;
  const context = canvas.getContext('2d')!;
  const image = context.createImageData(MAP_PX, MAP_PX);
  for (let y = 0; y < MAP_PX; y++)
    for (let x = 0; x < MAP_PX; x++) {
      const k = (y * MAP_PX + x) * 4;
      image.data[k] = Math.round(255 * (1 - (x + 0.5) / MAP_PX));
      image.data[k + 1] = Math.round(255 * (1 - (y + 0.5) / MAP_PX));
      image.data[k + 3] = 255;
    }
  context.putImageData(image, 0, 0);
  return (lensMap = canvas.toDataURL());
}

let defs: SVGDefsElement | undefined;
function defsElement() {
  if (defs?.isConnected) return defs;
  const svg = document.createElementNS(SVG, 'svg');
  svg.setAttribute('aria-hidden', 'true');
  svg.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden';
  defs = document.createElementNS(SVG, 'defs');
  svg.appendChild(defs);
  document.body.appendChild(svg);
  return defs;
}

type Lens = { id: string; key: string };
const lenses = new WeakMap<HTMLElement, Lens>();
let count = 0;

// The filter for a card whose lenses are `cellX` by `cellY` CSS pixels, on
// the `side` of the sky, calm (as a form field) on a small screen.
function filterMarkup(
  id: string,
  cellX: number,
  cellY: number,
  side: 'dark' | 'light',
  calm: boolean,
) {
  const blur = calm ? FIELD_FROST_PX : FROST_PX;
  const bend = calm ? FIELD_LENS : 1;
  const table = boundTable(side)
    .map((v) => v.toFixed(4))
    .join(' ');
  return `<filter id="${id}" x="0" y="0" width="1" height="1" color-interpolation-filters="sRGB">
  <feGaussianBlur in="SourceGraphic" stdDeviation="${blur}" edgeMode="duplicate" result="frost"/>
  <feImage href="${map()}" x="${FEATHER_TO}" y="${FEATHER_TO}" width="${cellX}" height="${cellY}" preserveAspectRatio="none" result="lens"/>
  <feTile in="lens" result="lenses"/>
  <feDisplacementMap in="frost" in2="lenses" scale="${displacement((cellX + cellY) / 2) * bend}" xChannelSelector="R" yChannelSelector="G"/>
  <feComponentTransfer>
    <feFuncR type="table" tableValues="${table}"/>
    <feFuncG type="table" tableValues="${table}"/>
    <feFuncB type="table" tableValues="${table}"/>
  </feComponentTransfer>
</filter>`;
}

// Whether any photo lies within the reach of `card`'s glass (as far past
// it as the scene's glass fades, FEATHER_TO).
function overPhoto(card: HTMLElement) {
  const box = card.getBoundingClientRect();
  for (const photo of document.querySelectorAll('.collage-tile')) {
    const r = photo.getBoundingClientRect();
    if (
      r.width > 0 &&
      r.right > box.left - FEATHER_TO &&
      r.left < box.right + FEATHER_TO &&
      r.bottom > box.top - FEATHER_TO &&
      r.top < box.bottom + FEATHER_TO
    )
      return true;
  }
  return false;
}

// Lays (or lifts) the glass over the photos under `card`, matching its
// lenses to the scene's (glass.ts: as many whole lenses of about CELL_PX as
// fit), on the side of the sky it is on, calm on a small screen.
export function photoLens(card: HTMLElement, calm: boolean) {
  if (!overPhoto(card)) {
    card.style.removeProperty('--photo-lens');
    return;
  }
  // The layer reaches FEATHER_TO past the card, whole from -FEATHER_FROM
  // inside it, as the scene's glass (its lenses laid from the card's corner,
  // FEATHER_TO into the layer).
  card.style.setProperty('--glass-reach', `${FEATHER_TO}px`);
  card.style.setProperty('--glass-fade', `${FEATHER_TO - FEATHER_FROM}px`);
  const { width, height } = card.getBoundingClientRect();
  const cellX = width / Math.max(Math.round(width / CELL_PX), 1);
  const cellY = height / Math.max(Math.round(height / CELL_PX), 1);
  const side = card.dataset.sky === 'light' ? 'light' : 'dark';
  const key = `${cellX.toFixed(3)} ${cellY.toFixed(3)} ${side} ${calm}`;
  let lens = lenses.get(card);
  if (!lens) {
    lens = { id: `photo-lens-${++count}`, key: '' };
    lenses.set(card, lens);
  }
  if (lens.key !== key) {
    lens.key = key;
    const host = defsElement();
    host.querySelector(`#${lens.id}`)?.remove();
    host.insertAdjacentHTML(
      'beforeend',
      filterMarkup(lens.id, cellX, cellY, side, calm),
    );
  }
  card.style.setProperty('--photo-lens', `url(#${lens.id})`);
}
