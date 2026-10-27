import { Shape } from 'three';

import { relativeLuminance } from './backdrop';

// Where a word's letters are on the page, to read exactly their pixels in
// the rendered frame (TitleName.tsx): the word's own 3D letter shapes drawn
// on a small canvas, and a few points well inside their strokes, in each of
// COLUMNS columns across the word. Points are in CSS pixels from the word's
// top-left corner.

export const COLUMNS = 12;
const PER_COLUMN = 6;

export type Mask = { points: { x: number; y: number }[][] };

// `shapes` are the letters as drawn, in ems from the baseline's left end,
// up; `width`, `height` and `baselineFromTop` the word's box on the page;
// `em` its font size in CSS pixels.
export function letterMask(
  shapes: Shape[],
  width: number,
  height: number,
  baselineFromTop: number,
  em: number,
): Mask {
  const across = Math.ceil(width);
  const down = Math.ceil(height);
  const canvas = document.createElement('canvas');
  canvas.width = across;
  canvas.height = down;
  const context = canvas.getContext('2d', { willReadFrequently: true })!;
  const path = new Path2D();
  const trace = (outline: { x: number; y: number }[]) =>
    outline.forEach(({ x, y }, k) =>
      path[k ? 'lineTo' : 'moveTo'](x * em, baselineFromTop - y * em),
    );
  for (const shape of shapes) {
    const { shape: outline, holes } = shape.extractPoints(8);
    trace(outline);
    holes.forEach(trace);
  }
  context.fillStyle = '#fff';
  context.fill(path, 'evenodd');
  const alpha = context.getImageData(0, 0, across, down).data;
  const solid = (x: number, y: number) =>
    x >= 0 &&
    y >= 0 &&
    x < across &&
    y < down &&
    alpha[(y * across + x) * 4 + 3]! > 200;
  const points: { x: number; y: number }[][] = Array.from(
    { length: COLUMNS },
    () => [],
  );
  // Well inside a stroke: solid two pixels out every way, so the sample is
  // the letter's face, not its edge blended with the sky.
  for (let y = 2; y < down - 2; y += 2)
    for (let x = 2; x < across - 2; x += 2)
      if (
        solid(x, y) &&
        solid(x - 2, y) &&
        solid(x + 2, y) &&
        solid(x, y - 2) &&
        solid(x, y + 2)
      )
        points[Math.min(Math.floor((x / across) * COLUMNS), COLUMNS - 1)]!.push(
          {
            x,
            y,
          },
        );
  return {
    points: points.map((column) =>
      column.length <= PER_COLUMN
        ? column
        : Array.from(
            { length: PER_COLUMN },
            (_, k) =>
              column[Math.floor(((k + 0.5) / PER_COLUMN) * column.length)]!,
          ),
    ),
  };
}

// Reads, from the frame just drawn, each column's letters (the average of its
// mask points) and what is just above and below the word: luminances, NaN
// where a column has no letter or the band is off the canvas or falls on one
// of the `others` (the name's other words).
export function readWord(
  gl: WebGL2RenderingContext | WebGLRenderingContext,
  canvas: HTMLCanvasElement,
  word: DOMRect,
  mask: Mask,
  others: DOMRect[] = [],
): { letters: number[]; above: number[]; below: number[] } {
  const bounds = canvas.getBoundingClientRect();
  const scale = canvas.width / bounds.width;
  const band = word.height * 0.12;
  // One read covering the word and the bands, in device pixels.
  const left = Math.max(Math.floor((word.left - bounds.left) * scale), 0);
  const right = Math.min(
    Math.ceil((word.right - bounds.left) * scale),
    canvas.width,
  );
  const top = Math.max(
    Math.floor((word.top - band - 2 - bounds.top) * scale),
    0,
  );
  const bottom = Math.min(
    Math.ceil((word.bottom + band + 2 - bounds.top) * scale),
    canvas.height,
  );
  const width = right - left;
  const height = bottom - top;
  const empty = Array(COLUMNS).fill(NaN);
  if (width <= 0 || height <= 0)
    return { letters: empty, above: empty, below: empty };
  const pixels = new Uint8Array(width * height * 4);
  gl.readPixels(
    left,
    canvas.height - bottom,
    width,
    height,
    gl.RGBA,
    gl.UNSIGNED_BYTE,
    pixels,
  );
  // A CSS point on the page to its luminance in the read block (rows count
  // up from the block's bottom).
  const at = (x: number, y: number) => {
    const px = Math.round((x - bounds.left) * scale) - left;
    const py = bottom - 1 - Math.round((y - bounds.top) * scale);
    if (px < 0 || py < 0 || px >= width || py >= height) return NaN;
    const i = (py * width + px) * 4;
    return relativeLuminance(pixels[i]!, pixels[i + 1]!, pixels[i + 2]!);
  };
  const letters = mask.points.map((column) => {
    const values = column
      .map(({ x, y }) => at(word.left + x, word.top + y))
      .filter((l) => !Number.isNaN(l));
    return values.length
      ? values.reduce((sum, l) => sum + l, 0) / values.length
      : NaN;
  });
  const middle = (k: number) => word.left + ((k + 0.5) / COLUMNS) * word.width;
  const clear = (x: number, y: number) =>
    others.some(
      (box) =>
        x > box.left - 2 &&
        x < box.right + 2 &&
        y > box.top - 2 &&
        y < box.bottom + 2,
    )
      ? NaN
      : at(x, y);
  return {
    letters,
    above: letters.map((_, k) => clear(middle(k), word.top - band)),
    below: letters.map((_, k) => clear(middle(k), word.bottom + band)),
  };
}
