// Whether a window `width` by `height` CSS pixels is small: a phone, or too
// short for much text. There the glass is calmer (glass.ts; its tint, kept
// for the open phone menu, is stronger) and the scene drawn lighter
// (quality.ts). Kept apart from glass.ts so code outside the scene can ask
// without loading three.js.
const SMALL_WIDTH = 768;
const SMALL_HEIGHT = 600;

export const isSmall = (width: number, height: number) =>
  width < SMALL_WIDTH || height < SMALL_HEIGHT;
