import { Vector4 } from 'three';

import {
  fadeAt,
  NARROW,
  PAGE_SCROLLER_ID,
  WIDE,
  WIDE_FROM,
} from '@/components/PageScroller/edgeFade';

// Where the glass cards are (glass.ts draws their glass): every `section`,
// and anything marked `data-glass`, read from the page every frame, with
// their form fields and the page's fade under the header and footer.

// The most cards frosted at once, and how many points down the window the
// page's fade is sampled at.
export const CARDS = 8;
export const FADE_SAMPLES = 64;
// Behind at most FIELDS form fields at once the glass is calmer (glass.ts).
export const FIELDS = 4;
// The glass's corners are rounded to at least CORNER_PX (CSS pixels), more
// than a card's own, so its fade stays round all the way in rather than
// squaring off inside the edge.
const CORNER_PX = 120;
export type Card = {
  element: HTMLElement;
  // Its box on the canvas, in canvas pixels from the bottom left.
  box: Vector4;
  // Its corner radius, in canvas pixels.
  radius: number;
  // Whether it scrolls in the page, and so fades with it.
  faded: boolean;
  // How see-through it is (its own CSS opacity and its ancestors'), so its
  // glass fades with it.
  opacity: number;
};

// An element's opacity as shown: its own times every ancestor's.
function shownOpacity(element: HTMLElement) {
  let opacity = 1;
  for (let at: HTMLElement | null = element; at; at = at.parentElement)
    opacity *= parseFloat(getComputedStyle(at).opacity);
  return opacity;
}

// Where the elements `selector` finds are on the canvas now, the first
// `most` on screen (read every frame: the page glides between posts by
// script, not only on scroll events).
function find(canvas: HTMLCanvasElement, selector: string, most: number) {
  const bounds = canvas.getBoundingClientRect();
  const scale = canvas.width / bounds.width;
  const found: Card[] = [];
  for (const element of document.querySelectorAll<HTMLElement>(selector)) {
    const box = element.getBoundingClientRect();
    const onScreen =
      box.width > 0 &&
      box.height > 0 &&
      box.bottom > bounds.top &&
      box.top < bounds.bottom;
    if (!onScreen || found.length === most) continue;
    // A card faded out or hidden (a post's card while another post shows,
    // components/useHeldCard.ts) takes no glass and no place in the limit.
    const opacity = shownOpacity(element);
    if (opacity < 0.001 || getComputedStyle(element).visibility === 'hidden')
      continue;
    found.push({
      element,
      box: new Vector4(
        (box.left - bounds.left) * scale,
        (bounds.bottom - box.bottom) * scale,
        (box.right - bounds.left) * scale,
        (bounds.bottom - box.top) * scale,
      ),
      radius: parseFloat(getComputedStyle(element).borderTopLeftRadius) * scale,
      faded: element.closest(`#${PAGE_SCROLLER_ID}`) !== null,
      opacity,
    });
  }
  return found;
}

export const findCards = (canvas: HTMLCanvasElement) => {
  const scale = canvas.width / canvas.getBoundingClientRect().width;
  return find(canvas, 'section, [data-glass]', CARDS).map((card) => ({
    ...card,
    // No more than half the card's shorter side.
    radius: Math.min(
      Math.max(card.radius, CORNER_PX * scale),
      (card.box.z - card.box.x) / 2,
      (card.box.w - card.box.y) / 2,
    ),
  }));
};

export const findFields = (canvas: HTMLCanvasElement) =>
  find(
    canvas,
    ':is(section, [data-glass]) :is(input, textarea, select)',
    FIELDS,
  );

// The page's fade down the window, top to bottom, as it is now.
export function pageFade(height: number) {
  const fade = window.innerWidth >= WIDE_FROM ? WIDE : NARROW;
  const footer =
    parseFloat(
      getComputedStyle(document.documentElement).getPropertyValue(
        '--footer-height',
      ),
    ) || 58;
  return Array.from({ length: FADE_SAMPLES }, (_, k) =>
    fadeAt((k / (FADE_SAMPLES - 1)) * height, height, footer, fade),
  );
}
