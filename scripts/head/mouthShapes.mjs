// The mouth's, jaw's and cheeks' own expressions (scripts/head/expressions.mjs
// has the first seven): the shapes of speech (an open "ah", a round "oh", a
// pursed "oo", a wide "ee", pressed lips for "m", the lower lip tucked in for
// "f") and the mouth's other moves. Each moves only the mouth and what its
// muscles pull: the eyes and brows stay still. Built with
// scripts/head/faceRig.mjs; distances in head.bin units (about 1.7 mm).

import { bump, crease, lips, minus, smoothstep } from './faceRig.mjs';
import { add } from './mesh.mjs';
import {
  evenOut,
  finishMouth,
  held,
  jawBlock,
  jawPose,
  mouthPlace,
  onLips,
  seal,
} from './mouthRig.mjs';
// "Ah": the jaw dropped (turning on its hinge and gliding forward), the lower
// lip carried with it, the upper lip lifting a little and the corners coming
// in and down, slack.
function jawOpen(rig, face) {
  const pins = held(rig, { jaw: true });
  const ANGLE = 0.29;
  lips(rig, face, pins, (s, lower, i) => {
    const p = rig.vertices[i];
    // Full across most of the width, so the opening is a tall oval rather
    // than a round "oh"; the corners stay wide (an "ah" does not purse).
    const body = 1 - s ** 4;
    if (!lower) return [0.3 * s * (1 - body), 1 * body, 0.3 * body];
    const carried = minus(jawPose(p, ANGLE), p);
    const corner = minus(jawPose(p, ANGLE * 0.45), p);
    return carried.map(
      (c, a) =>
        c * body +
        corner[a] * (1 - body) -
        (a === 0 ? -0.3 * s * (1 - body) : 0),
    );
  });
  face.lips.corners.forEach((i, k) => {
    const d = minus(jawPose(rig.vertices[i], ANGLE * 0.45), rig.vertices[i]);
    pins.set(i, [d[0] + (k ? 1 : -1) * 0.3, d[1], d[2]]);
  });
  jawBlock(rig, pins, (v) => jawPose(v, ANGLE));
  // The lips keep their fullness as they part, rounding the opening.
  const { line, fromEdge } = mouthPlace(rig, face);
  return finishMouth(rig, face, pins, (v, i, d) => {
    if (rig.pocket.has(i) || v[2] < 10) return;
    // The cheeks stretch flat over the open jaw, hollowing below the
    // cheekbones.
    const side = Math.sign(v[0]) || 1;
    const hollow =
      bump(Math.hypot(v[0] - side * 27, v[1] + 34), 8) *
      smoothstep(v[2], 10, 25);
    for (let k = 0; k < 3; k++) d[k] -= 1.6 * hollow * rig.normal[i][k];
    // Stretched over the open jaw the lips thin, the upper most, lying
    // flatter against the teeth.
    if (v[2] > 30)
      d[2] += (v[1] > line ? -0.4 : 0.6) * onLips(rig, fromEdge, v, 5);
    // Just outside each corner the muscles round the mouth meet in a firm
    // knot, standing out as the corner is stretched.
    for (const i0 of face.lips.corners) {
      const at = rig.vertices[i0];
      const out = Math.sign(at[0] - rig.mouth.middle);
      const knot = bump(Math.hypot(v[0] - at[0] - out * 3, v[1] - at[1]), 2.5);
      for (let k = 0; k < 3; k++) d[k] += 0.8 * knot * rig.normal[i][k];
    }
  });
}

// "F": the lower lip drawn up and back under the upper teeth, so from the
// front it all but disappears behind the upper lip, which rides forward over
// it; the roll of the lower lip pushed out by the teeth bulges below, over a
// deep crease above the chin.
function lowerLipIn(rig, face) {
  // The nose held: drawing the lower lip in left it dragging the tip down.
  const pins = held(rig, { nose: true });
  lips(rig, face, pins, (s, lower, i) => {
    const body = (1 - s * s) ** 0.7;
    // The lips meet (sealed) with the lower drawn back under the upper,
    // which comes forward to rest on it: no gap shows between them.
    return lower
      ? [0, (seal(rig, face, true, i) + 2.5) * body, -5 * body]
      : [0, (seal(rig, face, false, i) - 0.6) * body, 2.6 * body];
  });
  const { line, fromEdge } = mouthPlace(rig, face);
  return finishMouth(rig, face, pins, (v, i, d) => {
    if (rig.pocket.has(i) || v[2] < 30 || v[1] > line) return;
    const width = smoothstep(
      Math.abs(v[0] - rig.mouth.middle),
      rig.mouth.half,
      rig.mouth.half - 4,
    );
    const from = fromEdge(v);
    // The lip's inner part follows its edge under the teeth; its outer
    // roll is pushed out by them.
    d[2] += (-3 * bump(from, 2.5) + 1.4 * bump(from - 4.5, 2)) * width;
    d[1] += 1.2 * bump(from, 3) * width;
    crease(rig, i, d, {
      axis: 1,
      at: [-46.5],
      depth: 1.4,
      width: 1.6,
      mask: ([x]) => bump(x - rig.mouth.middle, 9),
    });
  });
}

// The jaw moved as one piece: `jaw(p)` is where the jaw carries the point p
// (the lower lip edge with it, less toward the corners, which go part of the
// way, and by `lip` more mid-lip); the upper lip moves by `upper` mid-lip.
function jawMove(jaw, upper = [0, 0, 0], lip = [0, 0, 0], depth = 1) {
  return (rig, face) => {
    const pins = held(rig, { jaw: true, nose: true });
    const moveOf = (i) => minus(jaw(rig.vertices[i]), rig.vertices[i]);
    // Toward the corners the lips meet the corners' move (most of the jaw's), both lips alike, so the corner does not shear. `depth` is how
    // much of the jaw's move toward or away from the face the lower lip takes:
    // slid sideways it slides along the upper lip rather than parting from it.
    lips(rig, face, pins, (s, lower, i) => {
      const end = Math.abs(s);
      const move = moveOf(i);
      if (!lower)
        return upper.map(
          (c, a) => c * (1 - s * s) + (a === 2 ? 0 : 0.7) * move[a] * end,
        );
      // Toward the corners the lips keep to the face's depth: carried
      // forward there they would fold over the cheek beside them.
      return move.map(
        (c, a) =>
          c * (1 - 0.3 * end) * (a === 2 ? depth * (1 - end) : 1) +
          lip[a] * (1 - s * s),
      );
    });
    for (const i of face.lips.corners)
      pins.set(
        i,
        moveOf(i).map((c, a) => 0.7 * c * (a === 2 ? depth : 1)),
      );
    jawBlock(rig, pins, jaw);
    const chin = moveOf(face.lips.lower[0])[0];
    const across = Math.abs(chin) > 1 ? Math.sign(chin) : 0;
    return finishMouth(rig, face, pins, (v, i, d) => {
      if (rig.pocket.has(i)) return;
      // Swung sideways, the jaw bunches the cheek over it on the side it
      // moves toward and pulls the other flat.
      const side = Math.sign(v[0]) || 1;
      const cheek =
        bump(Math.hypot(v[0] - side * 30, v[1] + 50), 9) *
        smoothstep(v[2], 0, 20);
      // Thrust forward, it pulls both cheeks tight along the jawline.
      const amount = !across ? -0.6 : side === across ? 1 : -0.6;
      for (let k = 0; k < 3; k++) d[k] += amount * cheek * rig.normal[i][k];
    });
  };
}

// The jaw's joints, in front of each ear (`HINGE` across).
const CONDYLE = { across: 38, y: -12, z: -14 };

// The jaw moved to one side (`side` 1 its own left, +x), as it does: it
// shifts a little that way as a whole (SHIFT) and swings about the joint on
// that side while the far joint glides forward, so the chin travels most,
// sideways and a little forward, and the jaw's angle on the moving side
// hardly moves.
const JAW_SIDE = { shift: 3.5, angle: 0.1 };
const jawSide = (side) =>
  jawMove(
    (p) => {
      const [cx, cz] = [side * CONDYLE.across, CONDYLE.z];
      const angle = side * JAW_SIDE.angle;
      const [dx, dz] = [p[0] - cx, p[2] - cz];
      return [
        cx +
          dx * Math.cos(angle) +
          dz * Math.sin(angle) +
          side * JAW_SIDE.shift,
        p[1],
        cz - dx * Math.sin(angle) + dz * Math.cos(angle),
      ];
    },
    [0, 0, 0],
    [0, 0, 0],
    0,
  );

const jawForward = jawMove(
  // Forward and a little down, as the jaw slides out of its sockets.
  (p) => add(p, [0, -1.5, 8.5]),
  [0, -0.5, 2.5],
  [0, 0.5, 0],
);

// The cheeks: blown out (`amount` above 0, the lips sealed and the air
// filling out the skin above and below them too) or sucked in (below 0, the
// mouth narrowed and the lips pursed forward).
function cheeks(amount) {
  return (rig, face) => {
    const pins = held(rig);
    const puff = amount > 0;
    const forward = puff ? 1.8 : 7.5;
    const narrow = puff ? 0 : 10;
    lips(rig, face, pins, (s, lower, i) => [
      -narrow * 0.7 * s,
      // Blown out, the lips seal; sucked in, they part into a small oval.
      puff ? seal(rig, face, lower, i) : (lower ? -1 : 0.6) * (1 - s * s),
      forward * (1 - 0.5 * s * s),
    ]);
    face.lips.corners.forEach((i, k) =>
      pins.set(i, [(k ? -1 : 1) * narrow, 0, forward * 0.6]),
    );
    const d = finishMouth(rig, face, pins, (v, i, d) => {
      if (rig.pocket.has(i)) return;
      const side = Math.sign(v[0]) || 1;
      const front = smoothstep(v[2], 5, 22);
      const cheek = puff
        ? // The air fills the space between the teeth and the cheek, from
          // the cheekbone to the jawline: one dome at the mouth's level.
          bump(Math.hypot(v[0] - side * 23, (v[1] + 30) * 0.85), 12) *
          (1 - smoothstep(-v[1], 48, 60)) *
          // Up to the cheekbone: the air does not reach up under the eye.
          (1 - smoothstep(v[1], -16, -8))
        : // One round hollow mid-cheek, under the cheekbone, where the cheek
          // is drawn in between the back teeth.
          bump(Math.hypot((v[0] - side * 35) * 1.2, (v[1] + 40) * 0.9), 9);
      // Clear of the nose and the lips themselves.
      const push = amount * cheek * front * smoothstep(Math.abs(v[0]), 12, 18);
      // The cheek moves along its surface: out, blown; in, sucked.
      for (let k = 0; k < 3; k++) d[k] += push * rig.normal[i][k];
      // Blown out, the air fills out the skin above and below the lips too,
      // most on the middle line; it pushes straight forward, so a groove in
      // the skin there (the one under the nose) is not pulled apart.
      if (puff)
        d[2] +=
          0.45 *
          // (Capped: the skin under the nose folds over past this.)
          Math.min(amount, 15) *
          (bump(Math.hypot((v[0] - rig.mouth.middle) * 0.5, v[1] + 31.5), 3.5) +
            bump(Math.hypot((v[0] - rig.mouth.middle) * 0.5, v[1] + 45), 4)) *
          smoothstep(v[2], 30, 38);
    });
    // Evened out so it reads as one smooth dome (blown out) or bowl
    // (sucked in), with no edge where it stops beside the nose.
    if (puff)
      return evenOut(
        rig,
        d,
        ([x, y, z]) =>
          smoothstep(Math.abs(x), 8, 16) *
          bump(y + 32, 18) *
          smoothstep(z, 0, 15),
        40,
      );
    return evenOut(
      rig,
      d,
      ([x, y, z]) =>
        smoothstep(Math.abs(x), 16, 22) *
        bump(y + 40, 16) *
        smoothstep(z, 0, 15),
      40,
    );
  };
}

// Shapes carried from ICT-FaceKit's scans instead (scripts/head/ict.mjs,
// ICT_SHAPES), named here so each keeps its place in head.bin.
const scanned = (rig, face) => face.vertices.map(() => [0, 0, 0]);

export const MOUTH_SHAPES = {
  jawOpen,
  mouthO: scanned,
  mouthU: scanned,
  pucker: scanned,
  lipStretch: scanned,
  press: scanned,
  lowerLipIn,
  frown: scanned,
  dimple: scanned,
  mouthLeft: scanned,
  mouthRight: scanned,
  jawLeft: jawSide(1),
  jawRight: jawSide(-1),
  jawForward,
  cheekPuff: scanned,
  cheekSuck: cheeks(-24),
};
