// Fitting a pair of glasses to a head as a real pair sits on a face: its
// front scaled as one piece to the head's width at the temples
// (templeWidth), set with its bridge on the nose (noseBridge), tipped about
// the bridge until the arms rest on the tops of the ears (earTop), and each arm flexed outward in one smooth curve, as a real arm
// bends round a head, just enough to clear the skull all along it
// (flexAmount, flexArm). The front, the lenses and each arm's own shape are
// the model's; only the arms' flex is added.

import type { BufferGeometry } from 'three';

// Where an arm turns: its hinge, looking down on it (x across, z forward).
export type Hinge = { x: number; z: number };

// The widest the head's `positions` (x, y, z in turn) are between the heights
// `low` and `high`, and between the depths `back` and `front`: across the
// temples, above the ears, for that band.
export function templeWidth(
  positions: ArrayLike<number>,
  {
    low,
    high,
    back,
    front,
  }: { low: number; high: number; back: number; front: number },
): number {
  let half = 0;
  for (let k = 0; k < positions.length; k += 3) {
    const y = positions[k + 1]!;
    const z = positions[k + 2]!;
    if (y < low || y > high || z < back || z > front) continue;
    half = Math.max(half, Math.abs(positions[k]!));
  }
  return 2 * half;
}

// How far forward the nose stands between the heights `low` and `high`,
// within `reach` of the middle: where the bridge of a pair rests.
export function noseBridge(
  positions: ArrayLike<number>,
  { low, high, reach }: { low: number; high: number; reach: number },
): number {
  let front = -Infinity;
  for (let k = 0; k < positions.length; k += 3) {
    const y = positions[k + 1]!;
    if (y < low || y > high || Math.abs(positions[k]!) > reach) continue;
    front = Math.max(front, positions[k + 2]!);
  }
  return front;
}

// How many places along an arm its clearance is checked at.
const STEPS = 24;

// Where a point lies from a hinge: `out` away from the head (sideways, along
// `side`: 1 at +x, -1 at -x) and `back` behind the hinge.
const fromHinge = (x: number, z: number, hinge: Hinge, side: 1 | -1) => ({
  out: (x - hinge.x) * side,
  back: hinge.z - z,
});

// How much of an arm's length, from its hinge, runs straight back over the
// head: behind it the arm hooks down behind the ear. The arm clears the skull
// all along its length at the straight part's height (its top band), so its
// back does not cut into the head above the ear; the ear below that band,
// which the hook rests on and curls behind, does not push it open.
export const STRAIGHT_SHARE = 0.7;

// A point of an arm or the head, from the hinge (fromHinge).
type Place = { out: number; back: number };

// The arm's whole length back from the hinge, and the band of heights its
// straight part (STRAIGHT_SHARE of it) runs at.
function armBand(arm: ArrayLike<number>, hinge: Hinge, side: 1 | -1) {
  let length = 0;
  for (let k = 0; k < arm.length; k += 3)
    length = Math.max(
      length,
      fromHinge(arm[k]!, arm[k + 2]!, hinge, side).back,
    );
  let low = Infinity;
  let high = -Infinity;
  for (let k = 0; k < arm.length; k += 3) {
    const back = fromHinge(arm[k]!, arm[k + 2]!, hinge, side).back;
    if (back > length * STRAIGHT_SHARE) continue;
    low = Math.min(low, arm[k + 1]!);
    high = Math.max(high, arm[k + 1]!);
  }
  return { length, low, high };
}

// Which of STEPS places along a part `length` long a point `back` behind
// the hinge falls in.
const stepAt = (back: number, length: number) =>
  Math.min(STEPS - 1, Math.floor((back / length) * STEPS));

// A place with no point of the arm takes its inner face from the places
// either side of it.
function fillGaps(inner: (Place | null)[], length: number): Place[] {
  const known = inner.flatMap((p, step) => (p ? [step] : []));
  return inner.map((p, step) => {
    if (p) return p;
    const before = known.filter((k) => k < step).at(-1);
    const after = known.find((k) => k > step);
    const a = inner[before ?? after!]!;
    const b = inner[after ?? before!]!;
    const t =
      before === undefined || after === undefined
        ? 0
        : (step - before) / (after - before);
    return {
      out: a.out + (b.out - a.out) * t,
      back: ((step + 0.5) / STEPS) * length,
    };
  });
}

// The arm's innermost point within its band at each place along it, or
// none if it has no point there at all.
function armInner(
  arm: ArrayLike<number>,
  hinge: Hinge,
  side: 1 | -1,
  { length, low, high }: { length: number; low: number; high: number },
): Place[] | null {
  const inner = new Array<Place | null>(STEPS).fill(null);
  for (let k = 0; k < arm.length; k += 3) {
    const y = arm[k + 1]!;
    if (y < low || y > high) continue;
    const p = fromHinge(arm[k]!, arm[k + 2]!, hinge, side);
    if (p.back <= 0 || p.back > length) continue;
    const step = stepAt(p.back, length);
    if (!inner[step] || p.out < inner[step]!.out) inner[step] = p;
  }
  return inner.some(Boolean) ? fillGaps(inner, length) : null;
}

// How far out the arm must be at each place to clear the head there by
// `margin`: the head's outermost point beside the straight part.
function headNeed(
  head: ArrayLike<number>,
  hinge: Hinge,
  side: 1 | -1,
  { length, low, high }: { length: number; low: number; high: number },
  margin: number,
): number[] {
  const need = new Array<number>(STEPS).fill(-Infinity);
  for (let k = 0; k < head.length; k += 3) {
    const y = head[k + 1]!;
    if (y < low || y > high) continue;
    const p = fromHinge(head[k]!, head[k + 2]!, hinge, side);
    if (p.back <= 0 || p.back > length) continue;
    const step = stepAt(p.back, length);
    need[step] = Math.max(need[step]!, p.out + margin);
  }
  return need;
}

// The shape of an arm's flex along it, from its hinge (0) to its end (1):
// a beam held at one end and pushed at the other, 0 at the hinge, 1 at the
// end, bending most toward the end.
export const flexShape = (t: number) => {
  const c = Math.min(1, Math.max(0, t));
  return (c * c * (3 - c)) / 2;
};

// How far an arm's end must flex outward (along `side`: 1 at +x, -1 at -x)
// for the arm (its `arm` positions, already placed) to clear the head (`head`
// positions) beside it by `margin` all along it, at the height of its
// straight part (STRAIGHT_SHARE): at each place along it, the head's
// outermost point there against the arm's innermost, flexed by flexShape.
export function flexAmount(
  head: ArrayLike<number>,
  arm: ArrayLike<number>,
  hinge: Hinge,
  side: 1 | -1,
  margin: number,
): number {
  const part = armBand(arm, hinge, side);
  if (part.length <= 0) return 0;
  const inner = armInner(arm, hinge, side, part);
  if (!inner) return 0;
  const need = headNeed(head, hinge, side, part, margin);
  return inner.reduce((most, p, step) => {
    // The flex at the near end of its place, so it clears all of it.
    const shape = flexShape(Math.min(p.back / part.length, step / STEPS));
    return shape > 0 ? Math.max(most, (need[step]! - p.out) / shape) : most;
  }, 0);
}

// The geometry flexed outward along `side` by `amount` at its end (`length`
// behind `hinge`), by flexShape along it: as a real arm bends round a head.
export function flexArm(
  geometry: BufferGeometry,
  hinge: Hinge,
  side: 1 | -1,
  amount: number,
  length: number,
): BufferGeometry {
  const position = geometry.getAttribute('position');
  for (let k = 0; k < position.count; k++) {
    const back = hinge.z - position.getZ(k);
    position.setX(
      k,
      position.getX(k) + side * amount * flexShape(back / length),
    );
  }
  position.needsUpdate = true;
  geometry.computeVertexNormals();
  geometry.computeBoundingBox();
  return geometry;
}

// The highest point of the ears between `back` and `front` (z) and below
// `high`: the head's points standing out past `beyond` from its middle (x),
// which only the ears do at their height.
export function earTop(
  positions: ArrayLike<number>,
  {
    beyond,
    back,
    front,
    high,
  }: { beyond: number; back: number; front: number; high: number },
): number {
  let top = -Infinity;
  for (let k = 0; k < positions.length; k += 3) {
    const y = positions[k + 1]!;
    const z = positions[k + 2]!;
    if (Math.abs(positions[k]!) < beyond || z < back || z > front || y > high)
      continue;
    top = Math.max(top, y);
  }
  return top;
}

// The arm's whole length back from the hinge (armBand), for flexArm.
export const armLength = (arm: ArrayLike<number>, hinge: Hinge, side: 1 | -1) =>
  armBand(arm, hinge, side).length;
