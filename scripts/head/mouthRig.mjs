// What the mouth's expressions (scripts/head/mouthShapes.mjs) are built
// from, on top of scripts/head/faceRig.mjs: the lip edge's resting curve,
// sealing the lips, the jaw's opening, and holding still what a mouth move
// must not reach. Distances in head.bin units (about 1.7 mm).

import {
  bump,
  finish,
  HINGE,
  length,
  minus,
  smoothstep,
  still,
  turn,
} from './faceRig.mjs';
import { add } from './mesh.mjs';

// Everything above this height stays still for the mouth's moves: the eyes,
// brows and the top of the nose.
const ABOVE = -6;
// How far round the lip edge the lips' fullness reaches, for moves that push
// the lips themselves rather than only their edge.
const LIP_REACH = 5;
// How far forward the jaw glides as it opens, per radian: it does not only
// turn on its hinge but slides forward out of it, so the chin drops more
// than it swings back.
const GLIDE = 20;
// How far sealed lips press past each other, so no line of the mouth's
// inside shows between them.
const SEAL = 0.6;

// How far the skin round each mouth corner goes with it across the face:
// without, a corner moved far sideways outruns the cheek beside it and folds
// the skin between. (Only across: carried down too, the skin above a corner
// that drops with the jaw would fold over the upper lip.)
const CORNER_REACH = 5;

// `finish` for a mouth move: the skin round each corner carried across with
// it (fading over CORNER_REACH), then `extra` as `finish` takes it.
export function finishMouth(rig, face, pins, extra) {
  const corners = face.lips.corners.map((i) => ({
    at: rig.vertices[i],
    move: pins.get(i) ?? [0, 0, 0],
  }));
  const d = finish(rig, face, pins, (v, i, d) => {
    for (const { at, move } of corners) {
      const w = bump(length(minus(v, at)), CORNER_REACH);
      d[0] += (move[0] - d[0]) * w;
    }
    extra?.(v, i, d);
  });
  // The skin just past each corner, where a moved corner pinches it into a
  // short crease running on from the mouth's line, evened out (not the lip
  // edges themselves, which keep the mouth's shape).
  const { fromEdge } = mouthPlace(rig, face);
  return evenOut(
    rig,
    d,
    (v) =>
      smoothstep(fromEdge(v), 0.4, 1.4) *
      Math.max(...corners.map(({ at }) => bump(length(minus(v, at)), 4))),
    20,
  );
}

// Still points for a mouth move; `jaw` moves reach down the throat, so then
// nothing near the join is held (the build carries them on down the neck);
// with `nose`, the nose is held too, for moves that pull the mouth sideways.
export function held(rig, { jaw = false, nose = false } = {}) {
  const pins = still(rig, { crown: ABOVE, seam: jaw ? -12 : 4 });
  if (nose)
    rig.vertices.forEach((v, i) => {
      if (v[1] > -29 && Math.abs(v[0]) < 15 && v[2] > 30)
        pins.set(i, [0, 0, 0]);
    });
  return pins;
}

// The lip edge's resting position on `axis` at x (its upper or lower half),
// so a lip point moved across the mouth keeps to the curve of the face.
function edgeAt(rig, face, lower, x, axis = 2) {
  const edge = (lower ? face.lips.lower : face.lips.upper)
    .map((i) => rig.vertices[i])
    .sort((a, b) => a[0] - b[0]);
  // Past a corner, the face's own surface carries on the curve.
  const beyond = (end) =>
    end[axis] +
    (axis === 2
      ? surfaceAt(rig, x, end[1]) - surfaceAt(rig, end[0], end[1])
      : 0);
  if (x <= edge[0][0]) return beyond(edge[0]);
  for (let k = 1; k < edge.length; k++)
    if (x <= edge[k][0]) {
      const [a, b] = [edge[k - 1], edge[k]];
      return a[axis] + ((x - a[0]) * (b[axis] - a[axis])) / (b[0] - a[0]);
    }
  return beyond(edge.at(-1));
}

// The depth of the front of the face at (x, y).
function surfaceAt(rig, x, y) {
  let best = -Infinity;
  rig.vertices.forEach((v, i) => {
    if (
      !rig.pocket.has(i) &&
      Math.abs(v[0] - x) < 1.5 &&
      Math.abs(v[1] - y) < 1.5
    )
      best = Math.max(best, v[2]);
  });
  return best;
}

// How far a lip point moves up (the lower lip) or down (the upper) to close
// the slight gap the lips rest with, pressing a little past each other.
export function seal(rig, face, lower, i) {
  const x = rig.vertices[i][0];
  const gap = Math.max(
    0,
    edgeAt(rig, face, false, x, 1) - edgeAt(rig, face, true, x, 1),
  );
  return lower ? 0.4 * gap + SEAL : -(0.6 * gap + SEAL);
}

// The corners' resting height midway, and how far each lip point is from the
// nearest point of the lip edge (for the lips' own fullness).
export function mouthPlace(rig, face) {
  const [a, b] = face.lips.corners.map((i) => rig.vertices[i]);
  const edge = [...face.lips.upper, ...face.lips.lower].map(
    (i) => rig.vertices[i],
  );
  const fromEdge = (v) => Math.min(...edge.map((e) => length(minus(v, e))));
  return { line: (a[1] + b[1]) / 2, fromEdge };
}
// How much of a move a point on the lips takes: the lips round the edge, out
// to their fullness, and not past the corners.
export const onLips = (rig, fromEdge, v, reach = LIP_REACH) =>
  bump(fromEdge(v), reach) *
  smoothstep(
    Math.abs(v[0] - rig.mouth.middle),
    rig.mouth.half + 4,
    rig.mouth.half - 2,
  );

// Where the jaw carries p when it opens by `angle`: turned about its hinge
// and glided forward.
export const jawPose = (p, angle) =>
  add(turn(p, HINGE, angle), [0, -4 * angle, GLIDE * angle]);

// The jaw, carried as one piece by `move(p)`: the chin, the jawline and the
// skin below the lower lip, fully in the middle and less out toward the
// jaw's angles, which are held still below the ears.
export function jawBlock(rig, pins, move) {
  rig.vertices.forEach((v, i) => {
    if (pins.has(i) || v[1] > -44 || v[2] < -8 || rig.height(v) < 4) return;
    // Only the front of the jaw is pinned; the field carries it smoothly on
    // to the still skin below the ears, so the jawline stays one curve.
    const w = 1 - smoothstep(Math.abs(v[0]), 10, 50);
    if (w > 0.25)
      pins.set(
        i,
        minus(move(v), v).map((c) => c * w),
      );
  });
}

// Evens out the moves `d` over the points where `mask(v)` is above 0 (each
// eased toward its neighbours' average by that share), `passes` times: where
// the skin is stretched far, neighbouring columns of the scan's points can
// move unevenly and show as stripes.
export function evenOut(rig, d, mask, passes) {
  const weight = rig.vertices.map((v, i) => (rig.pocket.has(i) ? 0 : mask(v)));
  const open = weight.flatMap((w, i) => (w > 0 ? [i] : []));
  for (let pass = 0; pass < passes; pass++) {
    const next = d.map((m) => [...m]);
    for (const i of open) {
      const sum = [0, 0, 0];
      for (const j of rig.neighbours[i])
        for (let a = 0; a < 3; a++) sum[a] += d[j][a];
      for (let a = 0; a < 3; a++)
        next[i][a] +=
          weight[i] * (sum[a] / rig.neighbours[i].size - d[i][a]) * 0.5;
    }
    d = next;
  }
  return d;
}
