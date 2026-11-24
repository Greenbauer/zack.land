import {
  BufferAttribute,
  BufferGeometry,
  CatmullRomCurve3,
  Shape,
  TubeGeometry,
  Vector2,
  Vector3,
} from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

// The smart bed's sleep mask (StoryProps.tsx): a real padded sleep mask, cut
// to a sleep mask's outline (two rounded pads over the eyes, a curved top, a
// notch over the nose), puffed up thickest in the middle and rounding off to
// a thin edge, and curved round the head's own face so it rests on the brow
// and the cheeks; long curly lashes stand out from two closed eyes on it
// (its print: maskPrint.ts), and a thin elastic strap goes round the back of
// the head above the ears. Everything is laid out in eye spreads (the
// distance between the eyes) from the eyes: `across` round the face, `up`,
// and `out` off it.

// How far behind the eyes the head's middle is, in eye spreads.
const MIDDLE_BACK = 1.4;
// The grid the head's shape is read on: steps round it and down it, over the
// heights from PROFILE.low to PROFILE.high.
const AROUND = 144;
const DOWN = 24;
const PROFILE = { low: -0.7, high: 0.8 };
// How many steps either way a hollow is bridged across (the eye sockets).
const BRIDGE = 3;
// How far the mask's back lies off the skin, how thick its pad puffs in the
// middle, and how far in from its edge the puff takes to round off.
const LIFT = 0.03;
export const PUFF = 0.11;
const ROUND = 0.22;
// The strap: its heights, and how far it lies off the skin.
const STRAP = { low: 0.26, high: 0.38, lift: 0.015 };
// How much the outline's drawn shape is narrowed to sit within the face.
const WIDTH = 0.84;
// The grid the pad is drawn on.
const PAD_ACROSS = 220;
const PAD_UP = 90;

const smoothstep = (t: number) => {
  const c = Math.min(1, Math.max(0, t));
  return c * c * (3 - 2 * c);
};

// The pad's outline, in eye spreads: the top gently arched, the ends
// rounded, a rounded pad under each eye and a notch over the nose.
export function maskOutline(): Vector2[] {
  const half = new Shape();
  half.moveTo(0, 0.48);
  half.bezierCurveTo(0.55, 0.5, 1.05, 0.47, 1.28, 0.34);
  half.bezierCurveTo(1.45, 0.24, 1.45, -0.12, 1.25, -0.28);
  half.bezierCurveTo(1.05, -0.46, 0.62, -0.52, 0.38, -0.4);
  half.bezierCurveTo(0.22, -0.32, 0.12, -0.12, 0, -0.1);
  // As wide as the face, no wider: drawn wider, it stood out past the head.
  const right = half.getPoints(48).map((p) => new Vector2(p.x * WIDTH, p.y));
  const left = right
    .slice(1, -1)
    .reverse()
    .map((p) => new Vector2(-p.x, p.y));
  return [...right, ...left];
}

// How far `p` is inside `outline`'s edge (negative outside).
export function edgeDistance(p: Vector2, outline: Vector2[]): number {
  let inside = false;
  let nearest = Infinity;
  for (let k = 0, j = outline.length - 1; k < outline.length; j = k++) {
    const a = outline[k]!;
    const b = outline[j]!;
    const crosses =
      a.y > p.y !== b.y > p.y &&
      p.x < ((b.x - a.x) * (p.y - a.y)) / (b.y - a.y) + a.x;
    if (crosses) inside = !inside;
    const ab = b.clone().sub(a);
    const t = Math.min(
      1,
      Math.max(0, p.clone().sub(a).dot(ab) / ab.lengthSq()),
    );
    nearest = Math.min(nearest, a.clone().addScaledVector(ab, t).distanceTo(p));
  }
  return inside ? nearest : -nearest;
}

type Grid = number[][];
const around = (col: number, by: number) => (col + by + AROUND) % AROUND;

// How far out the skin is from the head's middle at each step round and
// down (0 where there is none).
function skinReach(
  positions: ArrayLike<number>,
  middle: Vector3,
  low: number,
  high: number,
): Grid {
  const reach = Array.from({ length: AROUND }, () =>
    new Array<number>(DOWN + 1).fill(0),
  );
  for (let k = 0; k < positions.length; k += 3) {
    const row = Math.round(((positions[k + 1]! - low) / (high - low)) * DOWN);
    if (row < 0 || row > DOWN) continue;
    const dx = positions[k]! - middle.x;
    const dz = positions[k + 2]! - middle.z;
    const col = around(
      Math.round((Math.atan2(dx, dz) / (2 * Math.PI)) * AROUND),
      0,
    );
    reach[col]![row] = Math.max(reach[col]![row]!, Math.hypot(dx, dz));
  }
  return reach;
}

// The furthest out within BRIDGE steps round and one down of each point, so
// what is laid over it spans the hollows of the eye sockets.
function bridged(reach: Grid): Grid {
  const most = (col: number, row: number) => {
    const near: number[] = [];
    for (let by = -BRIDGE; by <= BRIDGE; by++)
      near.push(
        ...reach[around(col, by)]!.slice(Math.max(0, row - 1), row + 2),
      );
    return Math.max(...near);
  };
  return reach.map((column, col) => column.map((_, row) => most(col, row)));
}

// The head round its middle, for laying things on it: `radiusAt` is how far
// out it is at `angle` (0 straight ahead, positive toward +x) at its
// furthest between the heights `low` and `high` (eye spreads from the eyes).
export type Profile = {
  middle: Vector3;
  spread: number;
  eyes: Vector3;
  radiusAt: (_angle: number, _low: number, _high: number) => number;
};

export function headProfile(
  positions: ArrayLike<number>,
  eyes: Vector3,
  spread: number,
): Profile {
  const middle = new Vector3(eyes.x, eyes.y, eyes.z - MIDDLE_BACK * spread);
  const low = eyes.y + PROFILE.low * spread;
  const high = eyes.y + PROFILE.high * spread;
  const reach = bridged(skinReach(positions, middle, low, high));
  const rowOf = (up: number) =>
    ((eyes.y + up * spread - low) / (high - low)) * DOWN;
  const furthest = (col: number, rows: [number, number]) =>
    Math.max(...reach[around(col, 0)]!.slice(rows[0], rows[1] + 1));
  const radiusAt = (angle: number, from: number, to: number) => {
    const at = (angle / (2 * Math.PI)) * AROUND;
    const rows = [Math.floor(rowOf(from)), Math.ceil(rowOf(to))].map((r) =>
      Math.min(DOWN, Math.max(0, r)),
    ) as [number, number];
    const t = at - Math.floor(at);
    return (
      furthest(Math.floor(at), rows) * (1 - t) +
      furthest(Math.floor(at) + 1, rows) * t
    );
  };
  return { middle, spread, eyes, radiusAt };
}

// The pad's outline's lowest and highest points at `across` (Infinity and
// -Infinity where it has none).
function spanAt(outline: Vector2[], across: number): [number, number] {
  let low = Infinity;
  let high = -Infinity;
  for (let k = 0, j = outline.length - 1; k < outline.length; j = k++) {
    const a = outline[j]!;
    const b = outline[k]!;
    if ((a.x - across) * (b.x - across) > 0 || a.x === b.x) continue;
    const y = a.y + ((across - a.x) / (b.x - a.x)) * (b.y - a.y);
    low = Math.min(low, y);
    high = Math.max(high, y);
  }
  return [low, high];
}

export type Bounds = { left: number; right: number; low: number; high: number };

export type Mask = {
  pad: BufferGeometry;
  lashes: BufferGeometry;
  strap: BufferGeometry;
  // The outline's bounds: the pad's print spans them (eye spreads).
  bounds: Bounds;
};

// Where the eyes' closed lids are on the pad (eye spreads): their middles
// across and up, how far across either side each runs, and how far its
// middle droops below its ends.
export const LIDS = { across: 0.42, up: 0.06, half: 0.22, droop: 0.08 };

// A closed lid's line at `t` (-1 to 1 across it) for the eye on `side`.
export const lidAt = (side: 1 | -1, t: number) =>
  new Vector2(
    side * LIDS.across + t * LIDS.half,
    LIDS.up - LIDS.droop * (1 - t * t),
  );

export const outlineBounds = (outline: Vector2[]): Bounds => ({
  left: Math.min(...outline.map((p) => p.x)),
  right: Math.max(...outline.map((p) => p.x)),
  low: Math.min(...outline.map((p) => p.y)),
  high: Math.max(...outline.map((p) => p.y)),
});

type Place = (_across: number, _up: number, _out: number) => Vector3;

// The pad: a sheet over the outline's bounds, puffed out inside the outline
// (thickest in the middle, rounding off to nothing at the edge); what lies
// outside the outline is cut away by its print's alpha (maskPrint.ts).
function padSheet(outline: Vector2[], bounds: Bounds, place: Place) {
  const positions: number[] = [];
  const uvs: number[] = [];
  for (let j = 0; j <= PAD_UP; j++)
    for (let i = 0; i <= PAD_ACROSS; i++) {
      const [u, v] = [i / PAD_ACROSS, j / PAD_UP];
      const across = bounds.left + u * (bounds.right - bounds.left);
      const up = bounds.low + v * (bounds.high - bounds.low);
      const edge = edgeDistance(new Vector2(across, up), outline);
      const puff = PUFF * Math.sqrt(smoothstep(edge / ROUND));
      positions.push(...place(across, up, puff).toArray());
      uvs.push(u, v);
    }
  const index: number[] = [];
  for (let j = 0; j < PAD_UP; j++)
    for (let i = 0; i < PAD_ACROSS; i++) {
      const a = j * (PAD_ACROSS + 1) + i;
      const c = a + PAD_ACROSS + 1;
      index.push(a, a + 1, c + 1, a, c + 1, c);
    }
  const sheet = new BufferGeometry();
  sheet.setAttribute(
    'position',
    new BufferAttribute(new Float32Array(positions), 3),
  );
  sheet.setAttribute('uv', new BufferAttribute(new Float32Array(uvs), 2));
  sheet.setIndex(index);
  sheet.computeVertexNormals();
  return sheet;
}

// The long curly lashes: from each closed lid, LASHES of them hang down,
// then curl up and round at their tips in a loop, longer toward the eye's
// outer corner, standing out from the pad.
const LASHES = 7;
const CURL_STEPS = 10;
function lashCurve(root: Vector2, side: 1 | -1, t: number, place: Place) {
  const outer = (side * t + 1) / 2;
  const length = 0.17 + 0.09 * outer;
  // Each leans away from the middle of its eye, more toward the corners.
  const lean = 0.25 * t * LIDS.half;
  const curl = length * 0.32;
  // Straight down from the lid, then round a loop that turns out and up.
  const centre = new Vector2(
    root.x + lean + side * curl * 0.2,
    root.y - length + curl,
  );
  const points = [
    place(root.x, root.y, PUFF * 0.9),
    place(root.x + lean * 0.5, root.y - length * 0.45, PUFF + 0.06),
  ];
  for (let k = 0; k <= CURL_STEPS; k++) {
    // From the bottom of the loop, round outward and up, and a little past.
    const a = -Math.PI / 2 + side * (k / CURL_STEPS) * Math.PI * 1.35;
    points.push(
      place(
        centre.x + curl * Math.cos(a),
        centre.y + curl * Math.sin(a),
        PUFF + 0.12 + 0.12 * (k / CURL_STEPS),
      ),
    );
  }
  return new CatmullRomCurve3(points);
}
function lashTubes(place: Place, spread: number): BufferGeometry {
  const tubes: BufferGeometry[] = [];
  for (const side of [-1, 1] as const)
    for (let k = 0; k < LASHES; k++) {
      const t = -0.85 + (1.7 * k) / (LASHES - 1);
      const curve = lashCurve(lidAt(side, t), side, t, place);
      tubes.push(new TubeGeometry(curve, 40, spread * 0.018, 6));
    }
  return mergeGeometries(tubes);
}

// The strap: a thin band round the back of the head between STRAP's
// heights, from angle `from` round to `to`.
function strapBand(profile: Profile, from: number, to: number) {
  const { middle, spread, eyes } = profile;
  const STEPS = 96;
  const positions: number[] = [];
  for (let k = 0; k <= STEPS; k++) {
    const angle = from + ((to - from) * k) / STEPS;
    const r =
      profile.radiusAt(angle, STRAP.low, STRAP.high) + STRAP.lift * spread;
    for (const up of [STRAP.low, STRAP.high])
      positions.push(
        middle.x + r * Math.sin(angle),
        eyes.y + up * spread,
        middle.z + r * Math.cos(angle),
      );
  }
  const index: number[] = [];
  for (let k = 0; k < STEPS; k++) {
    const a = k * 2;
    index.push(a, a + 2, a + 1, a + 1, a + 2, a + 3);
  }
  const band = new BufferGeometry();
  band.setAttribute(
    'position',
    new BufferAttribute(new Float32Array(positions), 3),
  );
  band.setIndex(index);
  band.computeVertexNormals();
  return band;
}

// `reach` (by `across`) sampled across the pad and its ends, smoothed with
// its neighbours each side (SMOOTH of them) and read back by angle.
const SAMPLES = 160;
const SMOOTH = 6;
function smoothAcross(
  reach: (_across: number) => number,
  bounds: Bounds,
  acrossOf: (_angle: number) => number,
) {
  const from = bounds.left - 0.3;
  const to = bounds.right + 0.3;
  const raw = Array.from({ length: SAMPLES + 1 }, (_, k) =>
    reach(from + ((to - from) * k) / SAMPLES),
  );
  // Raised to the furthest out nearby, then averaged: smooth, and still
  // clear of the head.
  const window = (values: number[], k: number) =>
    values.slice(Math.max(0, k - SMOOTH), k + SMOOTH + 1);
  const raised = raw.map((_, k) => Math.max(...window(raw, k)));
  const even = raised.map((_, k) => {
    const near = window(raised, k);
    return near.reduce((a, b) => a + b, 0) / near.length;
  });
  return (angle: number) => {
    const at = ((acrossOf(angle) - from) / (to - from)) * SAMPLES;
    const k = Math.min(SAMPLES - 1, Math.max(0, Math.floor(at)));
    const t = Math.min(1, Math.max(0, at - k));
    return even[k]! * (1 - t) + even[k + 1]! * t;
  };
}

// The mask for a head whose shape is `profile`.
export function sleepMask(profile: Profile): Mask {
  const outline = maskOutline();
  const bounds = outlineBounds(outline);
  const { middle, spread, eyes } = profile;
  const front = profile.radiusAt(0, -0.1, 0.4);
  // At each angle, the head's furthest out over the pad's height there: the
  // pad is stiff up and down, so it rests on the brow and the cheeks and
  // spans the eyes; and smooth round, as padding is (read step by step it
  // changed in steps, which shaded the pad in stripes).
  const reachAt = (across: number) => {
    const clamped = Math.min(bounds.right, Math.max(bounds.left, across));
    const [low, high] = spanAt(outline, clamped);
    const angle = (across * spread) / front;
    return Number.isFinite(low)
      ? profile.radiusAt(angle, low, high)
      : profile.radiusAt(angle, bounds.low, bounds.high);
  };
  const base = smoothAcross(
    reachAt,
    bounds,
    (angle) => (angle * front) / spread,
  );
  // A point of the mask `across` round the face, `up`, and `out` off it.
  const place: Place = (across, up, out) => {
    const angle = (across * spread) / front;
    const r = base(angle) + (LIFT + out) * spread;
    return new Vector3(
      middle.x + r * Math.sin(angle),
      eyes.y + up * spread,
      middle.z + r * Math.cos(angle),
    );
  };
  const ends = [bounds.left, bounds.right].map(
    (across) => (across * spread) / front,
  ) as [number, number];
  return {
    pad: padSheet(outline, bounds, place),
    lashes: lashTubes(place, spread),
    // From just under the pad's ends, so it goes in under them.
    strap: strapBand(profile, ends[1] - 0.2, ends[0] + 2 * Math.PI + 0.2),
    bounds,
  };
}
