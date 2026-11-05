// The cords the neck's muscles make as the head turns to one side, added to
// its turn shapes (scripts/head/bodyShapes.mjs bodyMoves). Distances in
// head.bin units (about 1.7 mm).

import { bump, smoothstep } from './faceRig.mjs';

// The neck's axis in depth (as scripts/head/rig.mjs measures it), where a
// point sits round it (0 at the front, positive toward its own left), and
// the direction straight out from it.
const axisZ = (y) => -25 + (y + 72) * 0.43;
const around = ([x, y, z]) => Math.atan2(x, z - axisZ(y));
const radial = ([x, y, z]) => {
  const r = Math.hypot(x, z - axisZ(y)) || 1;
  return [x / r, 0, (z - axisZ(y)) / r];
};

// Turning the head to one side, the neck muscle on the other side (the
// sternocleidomastoid, which makes the turn) tightens and stands out as a cord
// from behind the ear down to beside the notch at the base of the throat, as
// in photos of real necks turned that way. MHR's shapes moved it under a
// millimetre, so the turned neck stayed smooth there. A tight muscle runs
// straight between its ends, and only one of them turns: the mastoid behind
// the earlobe turns with the skull, the end beside the notch stays put. So
// the cord follows the straight line between them in the turned pose, each
// point of the skin judged where its own share of the turn (rig.mjs
// turnWeights) carries it. (Laid round the neck at rest and then turned, the
// cord's top swung forward under the jaw with the skull and the muscle curved
// up under it like a C.) Near the ear it widens and flattens into the side of
// the neck, as the muscle's top does where it fans out onto the skull: it
// rises over most of its length and widens toward the top (narrow and ending
// over 16 units, its top stood out from the side of the neck as a knob). At
// the bottom it fades out over the lowest third, above the notch, as the
// muscle there narrows to a flat tendon on the breastbone (full down to 8
// units above the notch, it stood the base of the throat out 7 units, in
// front of the notch and the collarbones, turned far). SCM:
// how far it stands out (units, at full turn), its ends at rest (on the
// head's left, x mirrored for its right), the neck's turns it is shaped for
// (neckPose.ts FULL_TURN and FAR_TURN, less the body's share: headTurn.ts
// BODY_SHARE), its width (radians round the neck) at the top and
// the bottom, and the heights it fades in over (`from`, by `ends` at each).
//
// The muscle on the side the head turns toward is drawn out long and taut
// instead (its top swings back with the skull), and shows too, the further
// the turn the more, as a straight band from behind the ear down and forward
// across the side of the neck to the base of the throat, as in a photo of
// the subject turned 70 degrees: TAUT, how far it stands out at FAR_TURN.
export const SCM = {
  rise: 7,
  taut: 8,
  mastoid: [33, -34, -26],
  notch: [8, -126, -8],
  turn: 0.79 * 0.9,
  far: 1.55 * 0.9,
  width: [0.5, 0.26],
  from: [-70, -104],
  ends: [32, 18],
};
// Where the twist that turns the head by `angle` (toward +x) carries `p`:
// about the vertical through the top of the spine (headTurn.ts PIVOT).
const PIVOT_Z = -22;
const twisted = ([x, y, z], angle) => [
  x * Math.cos(angle) + (z - PIVOT_Z) * Math.sin(angle),
  y,
  -x * Math.sin(angle) + (z - PIVOT_Z) * Math.cos(angle) + PIVOT_Z,
];
// The cord of the muscle on `side` (of x) for a turn by `angle` (toward +x),
// standing out by `rise`.
// It fades out over ACROSS units short of the middle of the throat (cut off
// there, it left a step at the base of the throat turned).
const ACROSS = 6;
export const scmCord = (p, side, share, angle, rise) => {
  const across = smoothstep(side * p[0], 0, ACROSS);
  if (!across) return [0, 0, 0];
  const end = ([x, y, z]) => [side * x, y, z];
  const top = twisted(end(SCM.mastoid), angle);
  const bottom = end(SCM.notch);
  const [x, y, z] = twisted(p, angle * share);
  const t = Math.min(Math.max((y - top[1]) / (bottom[1] - top[1]), 0), 1);
  const line = top.map((c, k) => c + (bottom[k] - c) * t);
  const [high, low] = SCM.from;
  const at =
    rise *
    across *
    bump(
      Math.abs(around([x, y, z]) - around(line)),
      SCM.width[0] + (SCM.width[1] - SCM.width[0]) * t,
    ) *
    smoothstep(y, low - SCM.ends[1], low + SCM.ends[1]) *
    (1 - smoothstep(y, high - SCM.ends[0], high + SCM.ends[0]));
  return radial(p).map((c) => c * at);
};
