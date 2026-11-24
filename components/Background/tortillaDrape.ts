// The head's own shape where a thrown tortilla lands (tortillaFlight.ts): a
// surface seen from the way it was thrown, which the tortilla, soft and limp,
// lies on (tortillaPose.ts): it wraps round the head's sides and hangs down
// where nothing holds it up. In the head's own units.

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

// How far back the head's middle is, which the frames turn about.
const MIDDLE = -18;

// The frame of something thrown at the head from `azimuth` (radians from
// straight ahead, toward +x).
export function frameAt(azimuth: number): Frame {
  const [sin, cos] = [Math.sin(azimuth), Math.cos(azimuth)];
  return {
    local: (x, y, z) => [
      x * cos - (z - MIDDLE) * sin,
      y,
      x * sin + (z - MIDDLE) * cos,
    ],
    world: (across, up, out) => [
      across * cos + out * sin,
      up,
      MIDDLE - across * sin + out * cos,
    ],
  };
}

// The grid the surface is worked out on, and its reach, in the frame's
// units, at CELL apart.
const CELL = 4;
const REACH = { left: -120, right: 120, low: -190, high: 110 };
const COLS = Math.round((REACH.right - REACH.left) / CELL) + 1;
const ROWS = Math.round((REACH.high - REACH.low) / CELL) + 1;
// How steeply the tortilla falls away where nothing holds it up: below what
// holds it it hangs nearly straight down (HANG back for each unit down), and
// past the head's edge, above or to either side, it folds back over it
// (FOLD back for each unit).
const HANG = 0.25;
const FOLD = 1;

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

// How low the neck meets the shoulders.
const SHOULDERS = -72;

const AROUND = [-1, 0, 1].flatMap((c) => [-1, 0, 1].map((r) => [c, r]));

// The skin's outermost point in each cell and the cells round it, so the
// tortilla never dips into the skin between cells (-Infinity where there is
// no skin).
function outermost(positions: ArrayLike<number>, frame: Frame) {
  const grid = new Float32Array(COLS * ROWS).fill(-Infinity);
  for (let k = 0; k < positions.length; k += 3) {
    // The head and neck catch it, not the shoulders, which reach far out past
    // them to either side.
    if (positions[k + 1]! < SHOULDERS) continue;
    const [across, up, out] = frame.local(
      positions[k]!,
      positions[k + 1]!,
      positions[k + 2]!,
    );
    if (out < 0) continue;
    const { col, row } = cellOf(across, up);
    for (const [c, r] of AROUND) raise(grid, col + c!, row + r!, out);
  }
  return grid;
}

// Spreads each cell to its neighbours, falling away by `drop`: down, then
// up, then out to either side.
function spread(grid: Float32Array) {
  const at = (col: number, row: number) => grid[row * COLS + col]!;
  for (let col = 0; col < COLS; col++) {
    for (let row = ROWS - 2; row >= 0; row--)
      raise(grid, col, row, at(col, row + 1) - HANG * CELL);
    for (let row = 1; row < ROWS; row++)
      raise(grid, col, row, at(col, row - 1) - FOLD * CELL);
  }
  for (let row = 0; row < ROWS; row++) {
    for (let col = 1; col < COLS; col++)
      raise(grid, col, row, at(col - 1, row) - FOLD * CELL);
    for (let col = COLS - 2; col >= 0; col--)
      raise(grid, col, row, at(col + 1, row) - FOLD * CELL);
  }
}

// The points of a skin whose expressions move it by `moves` (x, y, z in turn
// for each of `positions`): where they are and wherever an expression puts
// them, so a tortilla lies over the cheek whatever face the head makes.
export function everyFace(
  positions: ArrayLike<number>,
  moves: ArrayLike<number>[],
): Float32Array {
  const all = Array.from(positions);
  for (const move of moves)
    for (let k = 0; k < move.length; k += 3)
      if (Math.hypot(move[k]!, move[k + 1]!, move[k + 2]!) > 0.4)
        for (const axis of [0, 1, 2])
          all.push(positions[k + axis]! + move[k + axis]!);
  return new Float32Array(all);
}

// How many times the surface is smoothed: a tortilla is stiff enough to
// bridge the small hollows and ridges of a face and an ear.
const SMOOTHINGS = 8;

// The surface a tortilla lies on, seen through `frame`, for a skin of
// `positions` (x, y, z in turn).
export function drapeSurface(
  positions: ArrayLike<number>,
  frame: Frame,
): Surface {
  const skin = outermost(positions, frame);
  const grid = skin.slice();
  spread(grid);
  for (let pass = 0; pass < SMOOTHINGS; pass++) {
    const was = grid.slice();
    for (let row = 1; row < ROWS - 1; row++)
      for (let col = 1; col < COLS - 1; col++) {
        let sum = 0;
        for (const [c, r] of AROUND) sum += was[(row + r!) * COLS + col + c!]!;
        grid[row * COLS + col] = Math.max(
          skin[row * COLS + col]!,
          sum / AROUND.length,
        );
      }
  }
  const at = (c: number, r: number) =>
    grid[
      Math.min(ROWS - 1, Math.max(0, r)) * COLS +
        Math.min(COLS - 1, Math.max(0, c))
    ]!;
  // Read between cells, so the tortilla lies smooth.
  return (across, up) => {
    const x = (across - REACH.left) / CELL;
    const y = (up - REACH.low) / CELL;
    const [c, r] = [Math.floor(x), Math.floor(y)];
    const [u, v] = [x - c, y - r];
    return (
      (at(c, r) * (1 - u) + at(c + 1, r) * u) * (1 - v) +
      (at(c, r + 1) * (1 - u) + at(c + 1, r + 1) * u) * v
    );
  };
}
