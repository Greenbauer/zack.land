// How a tortilla thrown at the head (tortillaFlight.ts) lies on it: soft and
// limp, it drapes over the head's own shape where it hits, wraps round it and
// hangs down where nothing holds it up, as a real one does. Worked out once
// from the head's skin as a surface seen from the way it was thrown
// (`drapeSurface`), then laid on each frame (`drapeOnto`), in the head's own
// units.

// The way a tortilla meets the head, as a frame: `across` and `up` along the
// surface it lands on, `out` toward where it came from. `local` turns a point
// of the head into that frame, `world` back.
export type Frame = {
  local: (_x: number, _y: number, _z: number) => [number, number, number];
  world: (
    _across: number,
    _up: number,
    _out: number,
  ) => [number, number, number];
};

// The side of the head on `side` (1 at +x, -1 at -x), its middle `middle`
// along z: thrown at it from that side.
export const sideOf = (side: 1 | -1, middle: number): Frame => ({
  local: (x, y, z) => [(z - middle) * side, y, x * side],
  world: (across, up, out) => [out * side, up, middle + across * side],
});

// The grid the surface is worked out on, and its reach, in the frame's
// units, at CELL apart.
const CELL = 4;
const REACH = { left: -110, right: 110, low: -170, high: 90 };
const COLS = Math.round((REACH.right - REACH.left) / CELL) + 1;
const ROWS = Math.round((REACH.high - REACH.low) / CELL) + 1;
// How steeply the tortilla falls away where nothing holds it up: below what
// holds it it hangs nearly straight down (HANG back for each unit down), and
// past the head's edge it folds back round it (FOLD back for each unit out).
const HANG = 0.3;
const FOLD = 1;
// How far off the skin it lies.
export const DRAPE_GAP = 1.5;

export type Surface = (_across: number, _up: number) => number;

const cellOf = (across: number, up: number) => ({
  col: Math.round((across - REACH.left) / CELL),
  row: Math.round((up - REACH.low) / CELL),
});

// Raises the cell at (col, row), if it is on the grid, to at least `out`.
function raise(grid: Float32Array, col: number, row: number, out: number) {
  if (col < 0 || col >= COLS || row < 0 || row >= ROWS) return;
  grid[row * COLS + col] = Math.max(grid[row * COLS + col]!, out);
}

const AROUND = [-1, 0, 1].flatMap((c) => [-1, 0, 1].map((r) => [c, r]));

// The skin's outermost point in each cell and the cells round it, so the
// tortilla never dips into the skin between cells (-Infinity where there is
// no skin).
function outermost(positions: ArrayLike<number>, frame: Frame) {
  const grid = new Float32Array(COLS * ROWS).fill(-Infinity);
  for (let k = 0; k < positions.length; k += 3) {
    const [across, up, out] = frame.local(
      positions[k]!,
      positions[k + 1]!,
      positions[k + 2]!,
    );
    const { col, row } = cellOf(across, up);
    for (const [c, r] of AROUND) raise(grid, col + c!, row + r!, out);
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

// The surface a tortilla drapes onto, seen through `frame`, for a skin of
// `positions` (x, y, z in turn): at each point, the skin's outermost there,
// held up from above where the skin falls away and from the middle where it
// ends; -Infinity where nothing holds it.
export function drapeSurface(
  positions: ArrayLike<number>,
  frame: Frame,
): Surface {
  const grid = outermost(positions, frame);
  hang(grid);
  fold(grid);
  return (across, up) => {
    const { col, row } = cellOf(across, up);
    const c = Math.min(COLS - 1, Math.max(0, col));
    const r = Math.min(ROWS - 1, Math.max(0, row));
    return grid[r * COLS + c]!;
  };
}

// The tortilla's points (`rest`: a flat round about its middle, x, y, z in
// turn, x across and y up its face) laid onto `surface` with their middle at
// `centre` (across, up), written into `out` as points of the head through
// `frame`; `amount` 0 leaves it flat at `flat` out, 1 lies it wholly on the
// surface (or flat, where nothing holds it).
export function drapeOnto(
  rest: ArrayLike<number>,
  centre: { across: number; up: number },
  surface: Surface,
  frame: Frame,
  amount: number,
  flat: number,
  out: Float32Array,
): void {
  for (let k = 0; k < rest.length; k += 3) {
    const across = centre.across + rest[k]!;
    const up = centre.up + rest[k + 1]!;
    const held = surface(across, up);
    const lying = Number.isFinite(held) ? held + DRAPE_GAP : flat;
    const point = frame.world(across, up, flat + (lying - flat) * amount);
    out.set(point, k);
  }
}
