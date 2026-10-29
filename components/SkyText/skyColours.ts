import {
  contrastRatio,
  relativeLuminance,
} from '@/components/Background/backdrop';
import head from '@/theme/head.json';

// The colours for text and icons over the 3D sky, from the luminance of the
// sky (and head) behind them, as BackdropSampler measures it. Like
// the home page's subtitle, text is always one of the theme's own colours
// (theme/head.json): its light over a dark sky, and over a light one the
// lightest of its darker colours that reads (WCAG AA). Grey items are that
// same colour, partly see-through. Links that used to
// turn a colour on hover, or that were coloured, take a theme colour: peach
// over a dark sky (the light where peach falls short of 3:1), deep indigo
// over a light one.

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
// The theme's colours for text over a light sky, lightest first.
const DARK_TEXT = [head.purple, head.blue, head.navy, head.dark].map(rgb);

const luminance = (c: Rgb) => relativeLuminance(...c);

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

// The lightest of the theme's darker colours that reaches `ratio` against a
// background of luminance `background`; its darkest where none quite does.
export const darkText = (background: number, ratio: number) =>
  DARK_TEXT.find((c) => contrastRatio(luminance(c), background) >= ratio) ??
  DARK;

// The theme colour that reads against `background`: its light wherever that
// reaches `ratio`, otherwise darkText; over the narrow band where neither
// light nor dark reaches it, whichever comes closer.
export function themeText(background: number, ratio: number) {
  const light = contrastRatio(luminance(LIGHT), background);
  if (light >= ratio) return LIGHT;
  const dark = darkText(background, ratio);
  return contrastRatio(luminance(dark), background) >= ratio ||
    contrastRatio(luminance(dark), background) > light
    ? dark
    : LIGHT;
}

// The colours as CSS values: text, its see-through grey and faint line,
// the accent, and the underline under a coloured link. `wasOnDark` is the
// side the text was on last, so it only switches once the sky is clearly
// past the crossover. `restingOnDark`, while the sky rests at its view's
// home (components/Background/skyState.ts), is the side its station reads on,
// which the text takes whatever the sky does.
export function skyColours(
  background: number,
  wasOnDark?: boolean,
  restingOnDark?: boolean,
) {
  const onDark = restingOnDark ?? isOnDark(background, wasOnDark);
  // On a dark sky, the light text. On a light one, the lightest of the
  // theme's darker colours that reads, never the light text itself.
  const text = onDark ? LIGHT : darkText(background, TEXT_RATIO);
  return {
    onDark,
    text: css(text),
    muted: css(text, MUTED_ALPHA),
    faint: css(text, FAINT_ALPHA),
    accent: css(
      onDark
        ? contrastRatio(luminance(rgb(head.peach)), background) >= ACCENT_RATIO
          ? rgb(head.peach)
          : LIGHT
        : rgb(head.indigo),
    ),
    underline: css(rgb(onDark ? head.rose : head.purple)),
    // A flat backing of the other side's theme colour, for text that crosses
    // both the sky and something much darker or lighter than it, as the
    // footer's crosses the head's chest on a phone (Footer/backing.ts).
    backing: css(onDark ? DARK : LIGHT),
  };
}
