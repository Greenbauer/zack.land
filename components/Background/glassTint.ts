import { isOnDark } from '@/components/SkyText/skyColours';

import { skyState } from './skyState';

// The glass cards' tint (glass.ts): the colour of the sky around each card,
// so the card matches its sky, with its text dark on a light sky and light
// on a dark one, as the text over the sky is (components/SkyText). The tint
// itself is worked out in the glass's shader every frame, from the sky
// around the card, so it follows the sky at once: on a dark sky the sky's
// colour darkened (keeping its hue) to TINT_LUMINANCE, the glass kept no
// brighter than BRIGHTEST; on a light sky the sky's colour, lightened toward
// head-light to LIGHT_TINT_LUMINANCE if need be, the glass kept no dimmer
// than DIMMEST. Either way the cards' text (all at full strength,
// styles/globals.css) keeps WCAG AA's 4.5:1, with a little to spare. Which side a card is on is decided here, a
// few times a second from the sky read back around it, and changes only
// once the sky is clearly past the crossover (isOnDark), over
// CHANGE_SECONDS, as its text does (styles/globals.css).

// sRGB channels, 0 to 255.
export type Rgb = [number, number, number];

export const TINT_LUMINANCE = 0.03;
export const BRIGHTEST = 0.115;
export const LIGHT_TINT_LUMINANCE = 0.45;
export const DIMMEST = 0.205;
// How long a card takes to change sides, in seconds (as its text): a
// gentle crossfade, since its text and glass both turn over at once. Its
// tint still follows the sky every frame.
export const CHANGE_SECONDS = 0.8;

const toLinear = (c: number) => {
  const s = c / 255;
  return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
};
const toSrgb = (l: number) =>
  255 * (l <= 0.0031308 ? 12.92 * l : 1.055 * l ** (1 / 2.4) - 0.055);
const luminance = (c: Rgb) =>
  0.2126 * toLinear(c[0]) + 0.7152 * toLinear(c[1]) + 0.0722 * toLinear(c[2]);

// What the glass shader is given for a card: how far it is on the light
// side (0 dark, 1 light), and the dimmest and brightest the glass may be,
// as luminances raised to 1 / 2.2 (the frame's own values, where the shader
// mixes).
export type Glass = { light: number; bounds: [number, number] };

const DARK_BOUNDS = [0, BRIGHTEST ** (1 / 2.2)];
const LIGHT_BOUNDS = [DIMMEST ** (1 / 2.2), 1];

// The glass `light` of the way from the dark side to the light.
const glassAt = (light: number): Glass => ({
  light,
  bounds: [0, 1].map(
    (k) => DARK_BOUNDS[k]! + (LIGHT_BOUNDS[k]! - DARK_BOUNDS[k]!) * light,
  ) as [number, number],
});

// Each card's side of the sky: a change of side runs over CHANGE_SECONDS,
// eased in and out as its text's (styles/globals.css), so the two turn over
// together.
export class CardTints {
  private readonly cards = new WeakMap<
    HTMLElement,
    { light: boolean; progress: number }
  >();

  // Puts `card` on the side of the sky around it, marking it as its
  // data-sky, light or dark, which its text follows (styles/globals.css).
  // A card over the head (data-head-avoid="above", EdgeCard.tsx) is on the
  // dark side whatever the sky, as most of what is behind its text is the
  // head's dark crown.
  aim(card: HTMLElement, sky: Rgb) {
    const state = this.cards.get(card);
    // A card above the head stays on the dark side; any other takes the
    // side of the view's station once that is settled (skyState.ts).
    const light =
      card.dataset.headAvoid !== 'above' &&
      (skyState.settled
        ? skyState.light
        : !isOnDark(
            luminance(sky),
            state === undefined ? undefined : !state.light,
          ));
    if (state) state.light = light;
    else this.cards.set(card, { light, progress: light ? 1 : 0 });
    const side = light ? 'light' : 'dark';
    if (card.dataset.sky !== side) card.dataset.sky = side;
  }

  // Puts a card new to the page straight on the settled side, before it is
  // first drawn, so it arrives on it rather than turning over once it is in.
  // (The sky around it does not count once the side is settled.)
  place(card: HTMLElement) {
    if (skyState.settled && !this.cards.has(card)) this.aim(card, [0, 0, 0]);
  }

  // The glass `card` shows now, `delta` seconds after the last call (the
  // dark side until it is first aimed).
  shown(card: HTMLElement, delta: number): Glass {
    const state = this.cards.get(card);
    if (!state) return glassAt(0);
    const step = delta / CHANGE_SECONDS;
    state.progress = Math.min(
      Math.max(state.progress + (state.light ? step : -step), 0),
      1,
    );
    const t = state.progress;
    return glassAt(t * t * (3 - 2 * t));
  }
}

// How far outside a card the sky around it is read, in CSS pixels: past
// the glass's soft edge (glass.ts's FEATHER_TO).
export const AROUND_PX = 176;

// The sky's colour from colours read around a card: the brighter half of
// them, averaged in linear light, so the head passing behind part of the
// ring (darker than the sky) does not swing the card from side to side.
export function skyOf(samples: Rgb[]): Rgb {
  const sorted = [...samples].sort((a, b) => luminance(a) - luminance(b));
  const sky = sorted.slice(Math.floor(sorted.length / 2));
  const sum = [0, 0, 0];
  for (const c of sky) for (let k = 0; k < 3; k++) sum[k]! += toLinear(c[k]!);
  return sum.map((c) => toSrgb(c / sky.length)) as Rgb;
}

// Where to read the sky around `card` (skyOf takes what is read there):
// points around its edge, AROUND_PX out, as device pixels from the bottom
// left of `canvas`; only those on it.
export function skyPoints(
  canvas: HTMLCanvasElement,
  card: Element,
): { x: number; y: number }[] {
  const bounds = canvas.getBoundingClientRect();
  const scale = canvas.width / bounds.width;
  const box = card.getBoundingClientRect();
  const [left, right] = [box.left - AROUND_PX, box.right + AROUND_PX];
  const [top, bottom] = [box.top - AROUND_PX, box.bottom + AROUND_PX];
  return [0, 0.25, 0.5, 0.75, 1]
    .flatMap((t) => [
      [left + t * (right - left), top],
      [left + t * (right - left), bottom],
      [left, top + t * (bottom - top)],
      [right, top + t * (bottom - top)],
    ])
    .map(([x, y]) => ({
      x: Math.round((x! - bounds.left) * scale),
      y: Math.round((bounds.bottom - y!) * scale),
    }))
    .filter(
      ({ x, y }) => x >= 0 && y >= 0 && x < canvas.width && y < canvas.height,
    );
}
