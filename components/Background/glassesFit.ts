// Fitting a pair of glasses to a head as a real pair fits a real head: the
// model is never reshaped. It is scaled as one piece so its front is as wide
// as the head at the temples (templeWidth), set with its bridge on the nose
// (noseBridge), and each arm swings open at its hinge, as a real one does,
// just far enough to clear the side of the head (openAngle, swingArm).

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
// The widest an arm opens, in radians, and the step it opens by.
const MOST_OPEN = (40 * Math.PI) / 180;
const OPEN_STEP = (0.25 * Math.PI) / 180;

// Where a point lies from a hinge: `out` away from the head (sideways, along
// `side`: 1 at +x, -1 at -x) and `back` behind the hinge.
const fromHinge = (x: number, z: number, hinge: Hinge, side: 1 | -1) => ({
  out: (x - hinge.x) * side,
  back: hinge.z - z,
});

// How much of an arm's length, from its hinge, runs straight back over the
// head: behind it the arm hooks down behind the ear, which it rests on, so
// the ear does not push it open.
export const STRAIGHT_SHARE = 0.7;

// A point of an arm or the head, from the hinge (fromHinge).
type Place = { out: number; back: number };

// The arm's straight part: how far it runs back from the hinge
// (STRAIGHT_SHARE of the whole arm) and its lowest and highest points there.
function straightPart(arm: ArrayLike<number>, hinge: Hinge, side: 1 | -1) {
  let whole = 0;
  for (let k = 0; k < arm.length; k += 3)
    whole = Math.max(whole, fromHinge(arm[k]!, arm[k + 2]!, hinge, side).back);
  const length = whole * STRAIGHT_SHARE;
  let low = Infinity;
  let high = -Infinity;
  for (let k = 0; k < arm.length; k += 3) {
    if (fromHinge(arm[k]!, arm[k + 2]!, hinge, side).back > length) continue;
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

// The arm's innermost point at each place along its straight part, or none
// if it has no point there at all.
function armInner(
  arm: ArrayLike<number>,
  hinge: Hinge,
  side: 1 | -1,
  length: number,
): Place[] | null {
  const inner = new Array<Place | null>(STEPS).fill(null);
  for (let k = 0; k < arm.length; k += 3) {
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

// The least angle an arm (its `arm` positions, already placed) must swing
// open at `hinge`, on `side`, for its inner face to clear the head (`head`
// positions) beside it by `margin` along its straight part (STRAIGHT_SHARE):
// at each place along it, the head's outermost point there against the
// arm's innermost. Only the head between that part's own lowest and highest
// points counts.
export function openAngle(
  head: ArrayLike<number>,
  arm: ArrayLike<number>,
  hinge: Hinge,
  side: 1 | -1,
  margin: number,
): number {
  const part = straightPart(arm, hinge, side);
  if (part.length <= 0) return 0;
  const inner = armInner(arm, hinge, side, part.length);
  if (!inner) return 0;
  const need = headNeed(head, hinge, side, part, margin);
  const clears = (angle: number) =>
    inner.every(
      (p, step) =>
        p.out * Math.cos(angle) + p.back * Math.sin(angle) >= need[step]!,
    );
  for (let angle = 0; angle <= MOST_OPEN; angle += OPEN_STEP)
    if (clears(angle)) return angle;
  return MOST_OPEN;
}

// The geometry turned whole by `angle` about the upright line through
// `hinge`, opening outward on `side`: as a real arm swings at its hinge.
export function swingArm(
  geometry: BufferGeometry,
  hinge: Hinge,
  side: 1 | -1,
  angle: number,
): BufferGeometry {
  const position = geometry.getAttribute('position');
  const [cos, sin] = [Math.cos(angle), Math.sin(angle)];
  for (let k = 0; k < position.count; k++) {
    const { out, back } = fromHinge(
      position.getX(k),
      position.getZ(k),
      hinge,
      side,
    );
    position.setX(k, hinge.x + side * (out * cos + back * sin));
    position.setZ(k, hinge.z - (back * cos - out * sin));
  }
  position.needsUpdate = true;
  geometry.computeVertexNormals();
  geometry.computeBoundingBox();
  return geometry;
}
