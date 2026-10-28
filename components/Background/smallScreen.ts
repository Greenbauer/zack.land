// Whether a window `width` by `height` CSS pixels is small: a phone, or too
// short for much text. There the glass is calmer and more strongly tinted
// (glass.ts), the scene drawn lighter (quality.ts), and the footer laid on
// the glass too (components/Footer). Kept apart from glass.ts so the page can
// ask without loading three.js.
const SMALL_WIDTH = 768;
const SMALL_HEIGHT = 600;

export const isSmall = (width: number, height: number) =>
  width < SMALL_WIDTH || height < SMALL_HEIGHT;
