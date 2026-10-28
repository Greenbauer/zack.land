import {
  CELL_PX,
  FEATHER_FROM,
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
// scene's (so the two meet seamlessly), on a layer behind the card's text:
// a card's own layer (data-photo-lens, just before it: EdgeCard.tsx), or
// for other glass the card's ::before (styles/globals.css). The layer sits
// outside the card because a card fading in by opacity is a backdrop root:
// a backdrop-filter inside it sees nothing until it is opaque again, so the
// glass would pop on at the end of the fade. The layer takes the card's
// opacity instead, every frame, and so fades in and out with it. It also
// keeps the photos within the card's brightness bounds (glassTint.ts), dark
// side or light, so the text over them keeps 4.5:1. It is on only while a
// photo is within PHOTO_REACH of the card.
// Toward its edges the glass weakens rather than turning see-through: its
// lenses bend less, its frost and bounds fade, so over a photo it eases in
// from nothing (a see-through lens would still show its hard squares).

const SVG = 'http://www.w3.org/2000/svg';
// The lens map is drawn at this resolution and stretched to each lens.
const MAP_PX = 64;
// How far past the card the glass reaches over photos (CSS pixels): less
// than the scene's glass, so the photos above a card keep clear. It eases
// in from nothing there to whole FEATHER_FROM inside the card's edge.
export const PHOTO_REACH = 64;
const FADE_PX = PHOTO_REACH - FEATHER_FROM;
// The fade map is drawn at a quarter of the layer's size and stretched.
const FADE_SCALE = 4;

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

// The glass's strength, 0 to 1, `edge` CSS pixels in from the layer's edge
// (along one axis; a point's strength is the product of both axes').
export function strengthAt(edge: number) {
  const t = Math.min(Math.max(edge / FADE_PX, 0), 1);
  return t * t * (3 - 2 * t);
}

// The layer's fade, as a data URL: grey, black at the edges to white where
// the glass is whole, for a layer `width` by `height` CSS pixels.
function fadeMap(width: number, height: number) {
  const w = Math.max(Math.ceil(width / FADE_SCALE), 1);
  const h = Math.max(Math.ceil(height / FADE_SCALE), 1);
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const context = canvas.getContext('2d')!;
  const image = context.createImageData(w, h);
  const along = (k: number, n: number, size: number) =>
    strengthAt(Math.min(k + 0.5, n - k - 0.5) * (size / n));
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const g = Math.round(255 * along(x, w, width) * along(y, h, height));
      const k = (y * w + x) * 4;
      image.data[k] = image.data[k + 1] = image.data[k + 2] = g;
      image.data[k + 3] = 255;
    }
  context.putImageData(image, 0, 0);
  return canvas.toDataURL();
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
// a layer `width` by `height`, on the `side` of the sky, calm (as a form
// field) on a small screen. The lens map is pulled toward no bend (0.5) as
// the fade map darkens (k1 L g + k3 g + k4 = 0.5 + (L - 0.5) g), and the
// result is laid over the photos as strongly as the fade map says.
function filterMarkup(
  id: string,
  cellX: number,
  cellY: number,
  layer: { width: number; height: number },
  side: 'dark' | 'light',
  calm: boolean,
) {
  const blur = calm ? FIELD_FROST_PX : FROST_PX;
  const bend = calm ? FIELD_LENS : 1;
  const table = boundTable(side)
    .map((v) => v.toFixed(4))
    .join(' ');
  return `<filter id="${id}" x="0" y="0" width="1" height="1" color-interpolation-filters="sRGB">
  <feImage href="${fadeMap(layer.width, layer.height)}" x="0" y="0" width="${layer.width}" height="${layer.height}" preserveAspectRatio="none" result="fade"/>
  <feColorMatrix in="fade" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0 0 0 0" result="strength"/>
  <feGaussianBlur in="SourceGraphic" stdDeviation="${blur}" edgeMode="duplicate" result="frost"/>
  <feImage href="${map()}" x="${PHOTO_REACH}" y="${PHOTO_REACH}" width="${cellX}" height="${cellY}" preserveAspectRatio="none" result="lens"/>
  <feTile in="lens" result="lenses"/>
  <feComposite in="lenses" in2="fade" operator="arithmetic" k1="1" k2="0" k3="-0.5" k4="0.5" result="bends"/>
  <feDisplacementMap in="frost" in2="bends" scale="${displacement((cellX + cellY) / 2) * bend}" xChannelSelector="R" yChannelSelector="G"/>
  <feComponentTransfer>
    <feFuncR type="table" tableValues="${table}"/>
    <feFuncG type="table" tableValues="${table}"/>
    <feFuncB type="table" tableValues="${table}"/>
  </feComponentTransfer>
  <feComposite in2="strength" operator="in" result="glass"/>
  <feMerge>
    <feMergeNode in="SourceGraphic"/>
    <feMergeNode in="glass"/>
  </feMerge>
</filter>`;
}

// Whether any photo lies within the reach of `card`'s glass (PHOTO_REACH).
function overPhoto(card: HTMLElement) {
  const box = card.getBoundingClientRect();
  for (const photo of document.querySelectorAll('.collage-tile')) {
    const r = photo.getBoundingClientRect();
    if (
      r.width > 0 &&
      r.right > box.left - PHOTO_REACH &&
      r.left < box.right + PHOTO_REACH &&
      r.bottom > box.top - PHOTO_REACH &&
      r.top < box.bottom + PHOTO_REACH
    )
      return true;
  }
  return false;
}

// A card's own layer for the glass over photos (EdgeCard.tsx renders it just
// before the card), if it has one.
const layerOf = (card: HTMLElement) => {
  const before = card.previousElementSibling;
  return before instanceof HTMLElement && before.dataset.photoLens !== undefined
    ? before
    : null;
};

// Where a card's own layer goes, for a card at `box` with the CSS `opacity`
// and `zIndex` it shows: PHOTO_REACH past it all round, just below it (or in
// DOM order, before it, when it has no z-index), as see-through as it is.
export function layerStyle(
  box: { left: number; top: number; width: number; height: number },
  opacity: string,
  zIndex: string,
) {
  const z = parseInt(zIndex, 10);
  return {
    left: `${box.left - PHOTO_REACH}px`,
    top: `${box.top - PHOTO_REACH}px`,
    width: `${box.width + 2 * PHOTO_REACH}px`,
    height: `${box.height + 2 * PHOTO_REACH}px`,
    opacity,
    zIndex: Number.isNaN(z) ? '' : String(z - 1),
  };
}

function placeLayer(layer: HTMLElement, card: HTMLElement, box: DOMRect) {
  const { opacity, zIndex } = getComputedStyle(card);
  Object.assign(layer.style, layerStyle(box, opacity, zIndex));
}

// The glass over photos for every card showing (`cards`), and none over the
// rest: a card that has faded out leaves its layer's glass off.
export function photoLenses(cards: HTMLElement[], calm: boolean) {
  for (const card of cards) photoLens(card, calm);
  const showing = new Set(cards.map(layerOf));
  for (const layer of document.querySelectorAll<HTMLElement>(
    '[data-photo-lens]',
  ))
    if (!showing.has(layer)) layer.style.removeProperty('--photo-lens');
}

// Lays (or lifts) the glass over the photos under `card`, matching its
// lenses to the scene's (glass.ts: as many whole lenses of about CELL_PX as
// fit), on the side of the sky it is on, calm on a small screen.
export function photoLens(card: HTMLElement, calm: boolean) {
  const own = layerOf(card);
  const target = own ?? card;
  if (!overPhoto(card)) {
    target.style.removeProperty('--photo-lens');
    return;
  }
  const box = card.getBoundingClientRect();
  // The layer reaches PHOTO_REACH past the card (its lenses laid from the
  // card's corner, PHOTO_REACH into the layer, as the scene's are).
  if (own) placeLayer(own, card, box);
  else card.style.setProperty('--glass-reach', `${PHOTO_REACH}px`);
  const { width, height } = box;
  const cellX = width / Math.max(Math.round(width / CELL_PX), 1);
  const cellY = height / Math.max(Math.round(height / CELL_PX), 1);
  const layer = {
    width: Math.round(width + 2 * PHOTO_REACH),
    height: Math.round(height + 2 * PHOTO_REACH),
  };
  const side = card.dataset.sky === 'light' ? 'light' : 'dark';
  const key = `${cellX.toFixed(3)} ${cellY.toFixed(3)} ${layer.width} ${layer.height} ${side} ${calm}`;
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
      filterMarkup(lens.id, cellX, cellY, layer, side, calm),
    );
  }
  target.style.setProperty('--photo-lens', `url(#${lens.id})`);
}
