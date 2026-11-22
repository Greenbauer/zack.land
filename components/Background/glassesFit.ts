import type { BufferGeometry } from 'three';

// Fitting a pair of glasses' arms round a head wider than their frame, as a
// real pair's arms flex: each arm (and the word on it) is pushed outward
// along its length by just what the head beside it needs, so it follows the
// side of the head from its hinge back to the ear.

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

// The geometry pushed outward by `fit` (armFit) along its length from the
// hinge back to `back`, in place; behind `back` it keeps the last push.
export function wrapArm(
  geometry: BufferGeometry,
  hinge: Hinge,
  side: 1 | -1,
  back: number,
  fit: number[],
): BufferGeometry {
  const position = geometry.getAttribute('position');
  const step = (hinge.z - back) / (fit.length - 1);
  for (let k = 0; k < position.count; k++) {
    const along = Math.min(
      fit.length - 1,
      Math.max(0, (hinge.z - position.getZ(k)) / step),
    );
    const before = Math.floor(along);
    const after = Math.min(fit.length - 1, before + 1);
    const out = fit[before]! + (fit[after]! - fit[before]!) * (along - before);
    position.setX(k, position.getX(k) + out * side);
  }
  position.needsUpdate = true;
  geometry.computeVertexNormals();
  geometry.computeBoundingBox();
  return geometry;
}
