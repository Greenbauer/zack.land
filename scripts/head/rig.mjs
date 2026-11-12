// How much each skin vertex follows the head when it moves, 0 to 1: the head
// fully, the neck less and less toward its base, the shoulders and chest not
// at all. The page bends the neck by each vertex's head weight as the head
// nods and tilts, and turns it to the side by its turn weight
// (components/Background/headTurn.ts), so the neck twists and bends smoothly
// between a moving head and still shoulders.

import {
  NECK_BASE_POINT,
  SKULL_PIVOT,
} from '../../components/Background/neckRig.ts';
import { smoothstep } from './falloff.mjs';
import { smooth } from './mesh.mjs';
import { axisZ } from './neckAxis.mjs';

// Heights over the seam (`height`, head.bin units) over which the weight goes
// from 0 at the base of the neck to 1. It reaches 1 well below the seam, so
// after the evening out below the whole skull still turns as one piece.
const ALONG = [-60, -18];
// Below the seam, only the neck turns: the weight falls away over these
// distances from the neck's axis, so the trapezius and shoulders stay put.
const OUT = [36, 52];
// From these heights over the seam up, the turn no longer falls away from the
// neck's axis: the jaw and chin, which reach far from it, turn with the head.
const HEAD = [-24, -8];
// The weights are then evened out over the surface, so no edge carries a jump
// that would crease when the head turns.
const PASSES = 40;
// Where MakeHuman's neck weights fade out: across (distance from the
// midline) and below (height).
const STILL = { across: [48, 62], below: [-132, -118] };
// The upper trapezius and the top of the back take a small share of the
// head's movement (`share` at the base of the neck), fading out across the
// shoulder (`across`, from the midline), down the back (`below`, height) and
// toward the front (`behind`, how far behind the neck's axis), so they move a
// little with the neck as the muscles joining them do. With none, the twist
// stopped dead at the base of the neck and the skin there sheared against a
// still trapezius; with 0.6, looking up slid the base of the back of the neck
// 23 mm and a tilt slid the top of the trapezius 13 mm, where a real one,
// held to the lowest joints of the spine, hardly moves.
const TRAPEZIUS = {
  share: 0.15,
  across: [30, 110],
  below: [-165, -100],
  behind: [-5, 20],
};

// How far up MakeHuman's neck each bone sits, as the share of the head's
// turn it takes (data/rigs/default_weights.mhw, CC0): the body's points
// those bones move, each with its weights' share, as [position, share]
// pairs at `placed` (the posed body).
const NECK_BONES = { neck01: 0.25, neck02: 0.5, neck03: 0.75, head: 1 };
export function neckLevels(weights, placed) {
  const levels = new Map();
  for (const [bone, share] of Object.entries(NECK_BONES))
    for (const [i, w] of weights[bone])
      levels.set(i, (levels.get(i) ?? 0) + w * share);
  return [...levels].map(([i, level]) => [placed[i], level]);
}

// The share each point of the skin takes from `points` (neckLevels): the
// average of those within REACH, nearer ones counting more.
const REACH = 6;
function carried(points, vertices) {
  const cell = (p) => p.map((c) => Math.floor(c / REACH)).join(',');
  const grid = new Map();
  for (const point of points) {
    const key = cell(point[0]);
    if (!grid.has(key)) grid.set(key, []);
    grid.get(key).push(point);
  }
  // The points in v's cell and the cells around it.
  const around = (v) => {
    const [cx, cy, cz] = v.map((c) => Math.floor(c / REACH));
    const near = [];
    for (let a = -1; a <= 1; a++)
      for (let b = -1; b <= 1; b++)
        for (let c = -1; c <= 1; c++)
          near.push(...(grid.get(`${cx + a},${cy + b},${cz + c}`) ?? []));
    return near;
  };
  return vertices.map((v) => {
    let sum = 0;
    let total = 0;
    for (const [p, s] of around(v)) {
      const d = Math.hypot(...p.map((x, k) => x - v[k]));
      if (d > REACH) continue;
      sum += s / (d + 0.5);
      total += 1 / (d + 0.5);
    }
    return total ? sum / total : 0;
  });
}

export function headWeights({ vertices, faces }, height, neck) {
  const weights = vertices.map(([x, y, z]) => {
    const h = height([x, y, z]);
    const radius = Math.hypot(x, z - axisZ(y));
    const tube = 1 - smoothstep(radius, ...OUT);
    const head = smoothstep(h, ...HEAD);
    return smoothstep(h, ...ALONG) * (tube + (1 - tube) * head);
  });
  // Below the seam, MakeHuman's neck bones' own weights where they reach
  // further (onto the trapezius and the top of the back), so a turn of the
  // head draws on the muscles that make it rather than stopping at the neck.
  const bones = carried(neck, vertices);
  // They fade out before the shoulders and chest (STILL), which stay put.
  vertices.forEach((p, i) => {
    if (height(p) >= 0) return;
    const reach =
      (1 - smoothstep(Math.abs(p[0]), ...STILL.across)) *
      smoothstep(p[1], ...STILL.below);
    const trapezius =
      TRAPEZIUS.share *
      (1 - smoothstep(Math.abs(p[0]), ...TRAPEZIUS.across)) *
      smoothstep(p[1], ...TRAPEZIUS.below) *
      smoothstep(axisZ(p[1]) - p[2], ...TRAPEZIUS.behind);
    weights[i] = Math.max(weights[i], bones[i] * reach, trapezius);
  });
  // Smoothing moves points, so the weights ride as each point's x and are
  // read back from it.
  const all = new Map(vertices.map((_, i) => [i, 1]));
  const evened = smooth(
    { vertices: weights.map((w) => [w, 0, 0]), faces },
    all,
    PASSES,
    false,
  );
  return evened.vertices.map(([w]) => Math.min(Math.max(w, 0), 1));
}

// Turning to the side, a real neck turns a little at each joint of its
// spine: about half at the one just under the skull (C1 on C2), the rest
// over the six below, least at the top and bottom (JOINTS, C7 on T1 up to
// C2 on C3, each its part of that half). So the skin turns more the higher
// up the spine it sits, and the throat, held to the lower vertebrae, stays
// facing forward while the jaw swings over it. (Turned with the head's
// weights, which reach 1 well below the skull, the throat turned with the
// head down to the Adam's apple and the neck turned as one piece.)
const JOINTS = [2, 6, 7, 7, 7, 3];
const UNDER_SKULL = 0.5;
// The spine from the base of the neck (C7 on T1) to the skull (the joint
// behind the earlobes), as the page's shader bends it (components/Background/
// neckRig.ts).
const SPINE = { base: NECK_BASE_POINT, top: SKULL_PIVOT };
// What turns whole, as the skull and jaw do: above the line from the back of
// the skull to under the chin (z, y in a side view). The skin below it takes
// the joint under the skull's half over BELOW_SKULL (height): the soft parts
// under the jaw and the skull's base, between the skull and C2.
const SKULL_LINE = { back: [-56, -38], front: [30, -66] };
const BELOW_SKULL = 28;
// Behind the neck the muscles of the back (the trapezius, and those under it
// from the skull to the top of the back) turn a little with the head too:
// BACK of each point's head weight, fading in over BEHIND (how far behind the
// neck's axis). Only a little: at a quarter of the turn the base of the back
// of the neck and the top of the trapezius slid 23 mm sideways in a full
// turn, where a real one hardly moves.
const BACK = 0.35;
const BEHIND = [0, 25];
const TURN_PASSES = 20;

// How far up the spine `p` sits, 0 at its base to 1 at the skull, measured
// along the spine, so the levels lean forward with it.
function level(p) {
  const along = SPINE.top.map((c, k) => c - SPINE.base[k]);
  const length = Math.hypot(...along);
  return (
    p.reduce((s, c, k) => s + (c - SPINE.base[k]) * along[k], 0) / length ** 2
  );
}

// The share of the turn the joints below `t` (level) give it, each blended
// over its own stretch of the spine.
function spineShare(t) {
  const total = JOINTS.reduce((s, j) => s + j, 0);
  const span = 1 / (JOINTS.length + 1);
  return JOINTS.reduce(
    (s, j, k) =>
      s +
      ((1 - UNDER_SKULL) *
        j *
        smoothstep(t, (k - 0.5) * span, (k + 0.5) * span)) /
        total,
    0,
  );
}

// How much of the head's turn to the side each skin vertex takes, 0 to 1:
// the skull 1, the shoulders and chest 0. `height` is the height over the
// seam where the head meets the neck (above it all turns whole); `weights`
// are headWeights'.
export function turnWeights({ vertices, faces }, height, weights) {
  const slope =
    (SKULL_LINE.front[1] - SKULL_LINE.back[1]) /
    (SKULL_LINE.front[0] - SKULL_LINE.back[0]);
  const overSkull = (p) =>
    p[1] - (SKULL_LINE.back[1] + (p[2] - SKULL_LINE.back[0]) * slope);
  const shares = vertices.map((p, i) => {
    const skull = smoothstep(overSkull(p), -BELOW_SKULL, 0);
    const radius = Math.hypot(p[0], p[2] - axisZ(p[1]));
    const neck = (1 - smoothstep(radius, ...OUT)) * spineShare(level(p));
    const back = BACK * weights[i] * smoothstep(axisZ(p[1]) - p[2], ...BEHIND);
    return skull + (1 - skull) * Math.max(neck, back);
  });
  // Evened out, with the skull (over both the seam and the line) held whole.
  const whole = (p) => height(p) >= 0 && overSkull(p) >= 0;
  const moving = new Map(
    vertices.flatMap((p, i) => (whole(p) ? [] : [[i, 1]])),
  );
  const evened = smooth(
    { vertices: shares.map((w) => [w, 0, 0]), faces },
    moving,
    TURN_PASSES,
    false,
  );
  return evened.vertices.map(([w]) => Math.min(Math.max(w, 0), 1));
}
