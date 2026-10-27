import {
  readableText,
  relativeLuminance,
} from '@/components/Background/backdrop';
import head from '@/theme/head.json';

// The colours for text and icons over the 3D sky, from the luminance of the
// sky (and head) behind them, as BackdropSampler measures it. Like
// the home page's subtitle, text is the theme's light colour wherever the sky
// allows and darkens toward its dark colour only as far as WCAG AA needs.
// Grey items are that same colour, partly see-through. Links that used to
// turn a colour on hover, or that were coloured, take a theme colour: peach
// over a dark sky, deep indigo over a light one.

type Rgb = [number, number, number];

// Text and icons, held to the 4.5:1 of normal text.
export const TEXT_RATIO = 4.5;
// Coloured accents (hover, the open menu item, a link), held to 3:1.
export const ACCENT_RATIO = 3;
// How see-through grey items and lines are.
export const MUTED_ALPHA = 0.7;
export const FAINT_ALPHA = 0.3;

// The share of what is behind that text is held against: the lightest, less
// the brightest few points (the head's small, bright reflections), which the
// text can cross without losing much of itself.
export const BEHIND_SHARE = 0.85;

// The luminance the colours are picked against, from the samples behind.
export function skyBehind(samples: readonly number[]) {
  const sorted = [...samples].sort((a, b) => a - b);
  return sorted[Math.floor(BEHIND_SHARE * (sorted.length - 1))]!;
}

const rgb = (hex: string): Rgb => [
  parseInt(hex.slice(1, 3), 16),
  parseInt(hex.slice(3, 5), 16),
  parseInt(hex.slice(5, 7), 16),
];
const LIGHT = rgb(head.light);
const DARK = rgb(head.dark);

const toLinear = (c: number) => {
  const s = c / 255;
  return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
};
const toSrgb = (l: number) =>
  Math.round(
    255 * (l <= 0.0031308 ? 12.92 * l : 1.055 * l ** (1 / 2.4) - 0.055),
  );
const luminance = (c: Rgb) => relativeLuminance(...c);

// `colour`, lightened toward `light` (in linear light) only as far as it
// takes to reach `ratio` against a background of luminance `background`.
function lighten(background: number, ratio: number, colour: Rgb, light: Rgb) {
  const target = ratio * (background + 0.05) - 0.05;
  const [from, to] = [luminance(colour), luminance(light)];
  if (from >= target) return colour;
  const t = Math.min((target - from) / (to - from), 1);
  return colour.map((c, k) =>
    toSrgb(toLinear(c) * (1 - t) + toLinear(light[k]!) * t),
  ) as Rgb;
}

const css = ([r, g, b]: Rgb, alpha = 1) =>
  alpha === 1 ? `rgb(${r} ${g} ${b})` : `rgb(${r} ${g} ${b} / ${alpha})`;

// The sky's luminance where light and dark text read equally well: below it
// text is light, above it dark.
export const CROSSOVER =
  Math.sqrt((luminance(LIGHT) + 0.05) * (luminance(DARK) + 0.05)) - 0.05;
// How far past CROSSOVER the sky has to go before text switches sides, so a
// sky hovering around it doesn't flicker the text between light and dark.
export const SWITCH_MARGIN = 0.04;

// Whether text sits on a dark sky, given which side it was on last.
export function isOnDark(background: number, wasOnDark?: boolean) {
  if (wasOnDark === undefined) return background < CROSSOVER;
  return wasOnDark
    ? background < CROSSOVER + SWITCH_MARGIN
    : background < CROSSOVER - SWITCH_MARGIN;
}

// The colours as CSS values: text, its see-through grey and faint line,
// the accent, and the underline under a coloured link. `wasOnDark` is the
// side the text was on last, so it only switches once the sky is clearly
// past the crossover.
export function skyColours(background: number, wasOnDark?: boolean) {
  const onDark = isOnDark(background, wasOnDark);
  // On a dark sky, the light text. On a light one, the lightest colour that
  // reads (darker the lighter the sky), and never the light text itself.
  const darkest = readableText(background, TEXT_RATIO, LIGHT, DARK);
  const text = onDark ? LIGHT : darkest === LIGHT ? DARK : darkest;
  return {
    onDark,
    text: css(text),
    muted: css(text, MUTED_ALPHA),
    faint: css(text, FAINT_ALPHA),
    accent: css(
      onDark
        ? lighten(background, ACCENT_RATIO, rgb(head.peach), LIGHT)
        : rgb(head.indigo),
    ),
    underline: css(rgb(onDark ? head.rose : head.purple)),
  };
}
