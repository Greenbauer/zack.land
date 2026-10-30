// How a post's images lie beside its card: each one its own tile, cropped to
// whichever of a few shapes its picture is nearest, the tiles packed edge to
// edge into one solid block that fills as much of their space as it can. Only
// the block's outer corners are rounded.

// The crops a tile can take, as width over height: wide, landscape, square
// and portrait.
export const CROPS = [16 / 9, 4 / 3, 1, 3 / 4] as const;

// The crop nearest a picture's shape. A video is wide.
export function cropFor({
  type,
  width = 1,
  height = 1,
}: {
  type: string;
  width?: number;
  height?: number;
}): number {
  if (type === 'YouTube') return 16 / 9;
  const shape = Math.log(width / height);
  return CROPS.reduce((best, crop) =>
    Math.abs(Math.log(crop) - shape) < Math.abs(Math.log(best) - shape)
      ? crop
      : best,
  );
}

// A tile's place in its box, in pixels from the box's top left, and which of
// its corners are rounded, in CSS's order: top left, top right, bottom right,
// bottom left.
export type Tile = {
  x: number;
  y: number;
  width: number;
  height: number;
  round: readonly [boolean, boolean, boolean, boolean];
};

// The ways to split n tiles, in order, into runs: [1, 2] is one, then two.
function* runs(n: number): Generator<number[]> {
  if (n === 0) yield [];
  for (let first = 1; first <= n; first++)
    for (const rest of runs(n - first)) yield [first, ...rest];
}

type Box = { x: number; y: number; width: number; height: number };

// The tiles of crops `aspects` packed in columns (each run a column, its tiles
// stacked and as wide as each other), as tall as the box or, if that is too
// wide, as wide as it, and centred.
function columns(
  aspects: readonly number[],
  split: readonly number[],
  width: number,
  height: number,
): Box[] {
  let at = 0;
  const widths = split.map((count) => {
    const run = aspects.slice(at, (at += count));
    return height / run.reduce((sum, aspect) => sum + 1 / aspect, 0);
  });
  const scale = Math.min(1, width / widths.reduce((sum, w) => sum + w, 0));
  const left = (width - widths.reduce((sum, w) => sum + w * scale, 0)) / 2;
  const top = (height - height * scale) / 2;
  const boxes: Box[] = [];
  let x = left;
  at = 0;
  split.forEach((count, column) => {
    const w = widths[column]! * scale;
    let y = top;
    for (const aspect of aspects.slice(at, (at += count))) {
      boxes.push({ x, y, width: w, height: w / aspect });
      y += w / aspect;
    }
    x += w;
  });
  return boxes;
}

// The crop one shape taller than `crop` (wide to landscape, landscape to
// square, square to portrait), or itself if it is the tallest.
export const taller = (crop: number) =>
  CROPS[
    Math.min(
      CROPS.indexOf(crop as (typeof CROPS)[number]) + 1,
      CROPS.length - 1,
    )
  ] ?? crop;

// How much less a layout counts for each tile cropped one shape taller than
// its picture: it has to fill that much more to be worth the closer crop.
const TALLER_COST = 0.85;

// The best packing: of every split into columns or into rows, with each tile
// at its own crop or one shape taller, the one that covers most of the box,
// counting more for using its height (the tiles stack up the side of the card
// before they spread across), and held back where it makes one tile much
// smaller than another.
function pack(
  crops: readonly number[],
  width: number,
  height: number,
  main?: number,
) {
  const score = (boxes: Box[], tallerCount: number) => {
    const areas = boxes.map((b) => b.width * b.height);
    const covered = areas.reduce((sum, a) => sum + a, 0);
    const top = Math.min(...boxes.map((b) => b.y));
    const bottom = Math.max(...boxes.map((b) => b.y + b.height));
    const largest = Math.max(...areas);
    // A main tile smaller than another counts for much less.
    const leads = main === undefined ? 1 : (areas[main]! / largest) ** 4;
    return (
      covered *
      (Math.min(...areas) / largest) ** 0.3 *
      ((bottom - top) / height) *
      TALLER_COST ** tallerCount *
      leads
    );
  };
  let best: Box[] = [];
  let bestScore = -Infinity;
  for (let choice = 0; choice < 2 ** crops.length; choice++) {
    // The main tile (a video) keeps its own shape.
    if (main !== undefined && choice & (1 << main)) continue;
    const aspects = crops.map((crop, k) =>
      choice & (1 << k) ? taller(crop) : crop,
    );
    const tallerCount = aspects.filter(
      (aspect, k) => aspect !== crops[k],
    ).length;
    // A choice that changes nothing was already tried.
    if (tallerCount < [...choice.toString(2)].filter((b) => b === '1').length)
      continue;
    for (const split of runs(aspects.length)) {
      const asColumns = columns(aspects, split, width, height);
      // Rows are columns of the box turned on its side.
      const asRows = columns(
        aspects.map((aspect) => 1 / aspect),
        split,
        height,
        width,
      ).map(({ x, y, width: w, height: h }) => ({
        x: y,
        y: x,
        width: h,
        height: w,
      }));
      for (const boxes of [asColumns, asRows]) {
        const value = score(boxes, tallerCount);
        if (value > bestScore) [best, bestScore] = [boxes, value];
      }
    }
  }
  return best;
}

// The tiles for images of crops `crops` (each tile takes its crop or one
// shape taller) in a box `width` by `height`, touching along their edges,
// centred across the box and down at its bottom, by the card, so the gap
// between them and the card is the same at any size (centred down the box too,
// a group limited by the box's width left a gap above the card that grew with
// the window's height). A `main` tile (by index; a video) is laid out as the
// largest, in its own shape. Edges fall on whole pixels, so neighbours share
// theirs exactly and no hairline of the sky shows between them.
export function collage(
  crops: readonly number[],
  width: number,
  height: number,
  main?: number,
): Tile[] {
  if (!crops.length || width <= 0 || height <= 0) return [];
  const boxes = pack(crops, width, height, main);
  const drop = height - Math.max(...boxes.map((box) => box.y + box.height));
  const edges = boxes.map((box) => ({
    left: Math.round(box.x),
    right: Math.round(box.x + box.width),
    top: Math.round(box.y + drop),
    bottom: Math.round(box.y + box.height + drop),
  }));
  const left = Math.min(...edges.map((edge) => edge.left));
  const right = Math.max(...edges.map((edge) => edge.right));
  const top = Math.min(...edges.map((edge) => edge.top));
  const bottom = Math.max(...edges.map((edge) => edge.bottom));
  return edges.map((edge) => ({
    x: edge.left,
    y: edge.top,
    width: edge.right - edge.left,
    height: edge.bottom - edge.top,
    round: [
      edge.top === top && edge.left === left,
      edge.top === top && edge.right === right,
      edge.bottom === bottom && edge.right === right,
      edge.bottom === bottom && edge.left === left,
    ],
  }));
}

// How much of a post's left side it keeps free for the head
// (components/useHeadClear.ts), in pixels, for a post `width` wide (the
// content's frame, centred and capped however wide the window) in a window
// `height` tall: room for a head a quarter of the way across, its face drawn
// about HEAD_REACH of the window's height to either side (measured at 1024 to
// 1920 pixels wide). The head then centres itself in the space the post
// leaves (components/Background/headPlace.ts). The shoulders reach further,
// low down, where the haze covers them.
export const HEAD_REACH = 0.15;
export const headRight = (width: number, height: number) =>
  width / 4 + HEAD_REACH * height;
