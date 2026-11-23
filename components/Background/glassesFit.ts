// Sizing a pair of glasses to a head, as the real pair fits the real head:
// the model kept whole, its arms straight, scaled up just until the front of
// both arms clears the side of the head (armFit, fitScale), so the frame
// sits as wide as the head is.

// An arm's hinge: where its front end's inner face is, looking down on it.
export type Hinge = { x: number; z: number };

// How many steps along an arm its fit is worked out at.
const STEPS = 24;

// How far out an arm on `side` (1 at +x, -1 at -x) must sit at each of
// STEPS + 1 places from its hinge back to `back`, to clear the head: the
// head's `positions` (x, y, z in turn) between the heights `low` and `high`,
// with `margin` to spare. Nothing at the hinge, never less farther back
// than nearer (an arm does not dip in again), and smoothed, so the arm
// bends evenly.
export function armFit(
  positions: ArrayLike<number>,
  hinge: Hinge,
  side: 1 | -1,
  { low, high, back }: { low: number; high: number; back: number },
  margin: number,
): number[] {
  const step = (hinge.z - back) / STEPS;
  const need = new Array<number>(STEPS + 1).fill(0);
  for (let k = 0; k < positions.length; k += 3) {
    const y = positions[k + 1]!;
    const z = positions[k + 2]!;
    if (y < low || y > high || z > hinge.z || z < back) continue;
    const out = (positions[k]! - hinge.x) * side + margin;
    // A point counts for the place behind it: the arm is there by then.
    const at = Math.min(STEPS, Math.ceil((hinge.z - z) / step));
    if (out > need[at]!) need[at] = out;
  }
  need[0] = 0;
  for (let k = 1; k <= STEPS; k++) need[k] = Math.max(need[k]!, need[k - 1]!);
  // Smoothed by its neighbours, without letting it back inside the head.
  return need.map((value, k) =>
    k === 0
      ? 0
      : Math.max(
          value,
          (need[k - 1]! + value + need[Math.min(STEPS, k + 1)]!) / 3,
        ),
  );
}

// The smallest scale, between `low` and `high`, at which `clears` holds (it
// holds from some scale on: a pair scaled up only moves its arms out), to
// within a thousandth of the range; `high` if it never does.
export function fitScale(
  clears: (_scale: number) => boolean,
  low: number,
  high: number,
): number {
  if (clears(low)) return low;
  for (let k = 0; k < 10; k++) {
    const middle = (low + high) / 2;
    if (clears(middle)) high = middle;
    else low = middle;
  }
  return high;
}
