// How a tortilla thrown at the face (tortillaFlight.ts) lies on it: soft and
// limp, it drapes over the face's own shape, wraps back round the cheeks and
// hangs down past the chin, as a real one does. Worked out once from the
// head's skin as a surface over the face (`drapeSurface`), then laid on each
// frame (`drapeOnto`), in the head's own units.

// The grid the surface is worked out on, and its reach: across and up the
// head's front, in the head's units, at CELL apart.
const CELL = 4;
const REACH = { left: -110, right: 110, low: -170, high: 90 };
const COLS = Math.round((REACH.right - REACH.left) / CELL) + 1;
const ROWS = Math.round((REACH.high - REACH.low) / CELL) + 1;
// How steeply the tortilla falls away where nothing holds it up: below the
// chin it hangs nearly straight down (HANG back for each unit down), and past
// the side of the head it folds back round it (FOLD back for each unit out).
const HANG = 0.3;
const FOLD = 1;
// How far off the skin it lies.
export const DRAPE_GAP = 1.5;

export type Surface = (_x: number, _y: number) => number;

const cellOf = (x: number, y: number) => ({
  col: Math.round((x - REACH.left) / CELL),
  row: Math.round((y - REACH.low) / CELL),
});

// Raises the cell at (col, row), if it is on the grid, to at least `z`.
function raise(grid: Float32Array, col: number, row: number, z: number) {
  if (col < 0 || col >= COLS || row < 0 || row >= ROWS) return;
  grid[row * COLS + col] = Math.max(grid[row * COLS + col]!, z);
}

// The skin's frontmost depth in each cell and the cells round it, so the
// tortilla never dips into the skin between cells (-Infinity where there is
// no skin).
function frontDepth(positions: ArrayLike<number>): Float32Array {
  const grid = new Float32Array(COLS * ROWS).fill(-Infinity);
  for (let k = 0; k < positions.length; k += 3) {
    const { col, row } = cellOf(positions[k]!, positions[k + 1]!);
    for (const [c, r] of [
      [0, 0],
      [-1, 0],
      [1, 0],
      [0, -1],
      [0, 1],
      [-1, -1],
      [1, -1],
      [-1, 1],
      [1, 1],
    ])
      raise(grid, col + c!, row + r!, positions[k + 2]!);
  }
  return grid;
}

// Hanging: each cell no further back than the one above it lets it fall.
function hang(grid: Float32Array) {
  for (let at = (ROWS - 1) * COLS - 1; at >= 0; at--)
    grid[at] = Math.max(grid[at]!, grid[at + COLS]! - HANG * CELL);
}

// Folding back: each cell no further back than the one nearer the middle
// lets it fold, out to either side.
function fold(grid: Float32Array) {
  const middle = Math.round(-REACH.left / CELL);
  for (let row = 0; row < ROWS; row++) {
    for (let col = middle - 1; col >= 0; col--)
      grid[row * COLS + col] = Math.max(
        grid[row * COLS + col]!,
        grid[row * COLS + col + 1]! - FOLD * CELL,
      );
    for (let col = middle + 1; col < COLS; col++)
      grid[row * COLS + col] = Math.max(
        grid[row * COLS + col]!,
        grid[row * COLS + col - 1]! - FOLD * CELL,
      );
  }
}

// The surface a tortilla drapes onto, over the face, for a skin of
// `positions` (x, y, z in turn; the face looks along +z): at each point, the
// skin's frontmost depth there, held up from above where the skin falls away
// (below the chin) and from the middle where it ends (past the cheeks);
// -Infinity where nothing holds it (above the head).
export function drapeSurface(positions: ArrayLike<number>): Surface {
  const grid = frontDepth(positions);
  hang(grid);
  fold(grid);
  return (x, y) => {
    const { col, row } = cellOf(x, y);
    const c = Math.min(COLS - 1, Math.max(0, col));
    const r = Math.min(ROWS - 1, Math.max(0, row));
    return grid[r * COLS + c]!;
  };
}

// The tortilla's points (`rest`: a flat round about its middle, x, y, z in
// turn) laid onto `surface` with their middle at `centre`, written into
// `out`; `amount` 0 leaves it flat at `flatZ`, 1 lies it wholly on the
// surface (or flat, where nothing holds it).
export function drapeOnto(
  rest: ArrayLike<number>,
  centre: { x: number; y: number },
  surface: Surface,
  amount: number,
  flatZ: number,
  out: Float32Array,
): void {
  for (let k = 0; k < rest.length; k += 3) {
    const x = centre.x + rest[k]!;
    const y = centre.y + rest[k + 1]!;
    const held = surface(x, y);
    const lying = Number.isFinite(held) ? held + DRAPE_GAP : flatZ;
    out[k] = x;
    out[k + 1] = y;
    out[k + 2] = flatZ + (lying - flatZ) * amount;
  }
}
