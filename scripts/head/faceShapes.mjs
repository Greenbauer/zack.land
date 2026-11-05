// The eyes', brows' and nose's own expressions (scripts/head/expressions.mjs
// has the first seven). Each is one muscle's move, or a few that always go
// together, so the page can mix them; the names follow the moves (a blink, a
// nose flare) rather than a feeling. Built with scripts/head/faceRig.mjs;
// distances in head.bin units (about 1.7 mm).

import {
  brows,
  bump,
  crease,
  EYE_RADIUS,
  field,
  finish,
  length,
  lids,
  lips,
  minus,
  smileFold,
  smoothstep,
  still,
  turn,
} from './faceRig.mjs';
import { add } from './mesh.mjs';

// How far a closed lid stands off the eyeball (the lid's thickness), upper
// and lower: the upper lid closes over the lower one. A morph moves points in
// straight lines, so a lid half closed cuts inside the arc it turns along;
// standing this far off keeps the eyeball from showing through it then.
const LID_OFF = { upper: 1.4, lower: 0.6, corner: 0.45 };
// How far past each other the closed lids reach mid-lid (radians), so no slit
// of eyeball shows between them.
const LID_OVERLAP = 0.04;
// How deep the crease above a closed upper lid stays.
const LID_CREASE = 0.2;
// Points farther than this from an eyeball's centre stay still as it blinks:
// the lids move, the brow and cheek below them do not.
const ORBIT = 14;
// How far in from each corner (a share of the lid's arc) the lids close in
// full: less far at the inner corner, where a gap would show the eyeball
// beside the nose.
const CORNER = { outer: 0.15, inner: 0.12 };

// The brows' moves reach no lower than this: the mouth stays still.
const BROW_FLOOR = -14;

// The angle of p about the eye's centre, up from straight ahead.
const angleOf = (p, c) => Math.atan2(p[1] - c[1], p[2] - c[2]);
// A value along a rim's points (sorted by x) at x, by straight lines between.
function along(points, x) {
  if (x <= points[0].x) return points[0].value;
  for (let k = 1; k < points.length; k++)
    if (x <= points[k].x) {
      const [a, b] = [points[k - 1], points[k]];
      return a.value + ((x - a.x) * (b.value - a.value)) / (b.x - a.x);
    }
  return points.at(-1).value;
}

// A blink: the upper lid turns down over the eyeball to meet the lower, which
// rises a little toward it (the upper does four fifths of the closing, as in
// a real blink), each standing its thickness off the eyeball. The skin round
// the eye turns with the lids, less and less out to the bony rim of the
// socket, so the lid stays a smooth dome over the eye.
// `upperShare` is how much of the closing the upper lid does (the rest the
// lower); `squeeze` bunches the cheek up under the shut eye, as in a wink.
function blink(rig, { upperShare = 0.68, squeeze = 0 } = {}) {
  const pins = still(rig);
  const nearest = (p) =>
    rig.eyes.reduce((best, e) =>
      length(minus(p, e)) < length(minus(p, best)) ? e : best,
    );
  rig.vertices.forEach((v, i) => {
    if (length(minus(v, nearest(v))) > ORBIT) pins.set(i, [0, 0, 0]);
  });
  const uppers = closeRims(rig, pins, upperShare);
  // The field of angles and pushes, then each point turned by its own.
  const spread = field(rig, pins, new Set(pins.keys()));
  return rig.vertices.map((p, i) => {
    const [angle, off] = spread[i];
    // Squeezed shut, the cheek under the eye bunches up toward it (below
    // the lower lid, which the closing itself moves).
    const side = Math.sign(p[0]) || 1;
    const cheek =
      squeeze *
      bump(Math.hypot(p[0] - side * 25, (p[1] + 12) * 1.2), 8) *
      smoothstep(p[2], 15, 28) *
      (1 - smoothstep(p[1], -7, -3));
    const bunch = [0, 2 * cheek, 0.8 * cheek];
    if (!angle && !off) return bunch;
    const c = nearest(p);
    const r = length(minus(p, c));
    const fold = lidFold(p, c, uppers);
    const out = c.map((cc, a) => cc + ((p[a] - cc) * (r + off - fold)) / r);
    return add(minus(turn(out, c, angle), p), bunch);
  });
}

// The crease of the upper lid, a little above its edge, stays as the lid
// closes, so the closed lid shows its fold rather than a bare dome: how far
// in it holds point p, over the eye centred at c (`uppers`: each eye's upper
// rim, from closeRims).
function lidFold(p, c, uppers) {
  const eye = uppers.find((u) => u.centre === c);
  if (!eye || p[0] <= eye.low || p[0] >= eye.high) return 0;
  const above = angleOf(p, c) - along(eye.upper, p[0]);
  const t = (p[0] - eye.low) / (eye.high - eye.low);
  return LID_CREASE * bump(above - 0.32, 0.1) * (1 - (2 * t - 1) ** 2);
}

// Each eyelid rim's closing, pinned in `pins` as the angle it turns and how
// far it is pushed out (the field's first two values), the upper lid doing
// `upperShare` of it; returns each eye's upper rim, for its crease.
function closeRims(rig, pins, upperShare) {
  const uppers = [];
  for (const { loop, centre, line, arc } of rig.rims) {
    const rim = loop.map((i) => {
      const p = rig.vertices[i];
      return {
        i,
        p,
        x: p[0],
        upper: p[1] > line(p[0]),
        value: angleOf(p, centre),
      };
    });
    const [upper, lower] = [true, false].map((top) =>
      rim.filter((r) => r.upper === top).sort((a, b) => a.x - b.x),
    );
    uppers.push({ centre, upper, low: upper[0].x, high: upper.at(-1).x });
    for (const point of rim)
      pins.set(
        point.i,
        rimClosing(point, { centre, arc, upper, lower }, upperShare),
      );
  }
  return uppers;
}

// One lid rim point's closing ({ i, p, x, upper, value }, on the rim of the
// eye centred at `centre`): the angle it turns and how far it is pushed out,
// riding as the field's first two values.
function rimClosing(
  { p, x, upper: top, value },
  { centre, arc, upper, lower },
  upperShare,
) {
  const gap = top ? value - along(lower, x) : along(upper, x) - value;
  const share = top ? upperShare : 1 - upperShare;
  // Right at the corners the rim turns steeply between the lids; closing it
  // there in full would fold it, so the corners close a little less.
  const angle =
    (top ? 1 : -1) *
    (share * Math.max(gap, 0) + LID_OVERLAP * arc(x)) *
    smoothstep(
      arc(x),
      0,
      Math.abs(x) < Math.abs(centre[0]) ? CORNER.inner : CORNER.outer,
    );
  const r = length(minus(p, centre));
  // At the corners, where the closing eases off, the lids still come just
  // off the eyeball so none of it shows past them.
  const lid = top ? LID_OFF.upper : LID_OFF.lower;
  const off = Math.max(
    0,
    EYE_RADIUS + LID_OFF.corner + (lid - LID_OFF.corner) * arc(x) ** 0.5 - r,
  );
  return [angle, off, 0];
}

// Brows down and together (the frown between the eyes, as in anger or hard
// concentration): the inner ends pulled down and in, the skin between them
// bunched forward, the upper lids lowered a touch.
function browDown(rig, face) {
  const pins = still(rig, { floor: BROW_FLOOR, nose: true });
  lids(rig, pins, 0.14, 0.04);
  brows(rig, pins, (across, side) => {
    const inner = 1 - smoothstep(across, 6, 28);
    return [
      -side * 3.6 * inner * smoothstep(across, 0, 6),
      -4.6 * inner - 0.8,
      0.3 * inner,
    ];
  });
  return finish(rig, face, pins, (v, i, d) => {
    // The bunched skin between the brows, over the top of the nose, with a
    // furrow up either side of it.
    const glabella =
      bump(Math.hypot(v[0], v[1] - 8), 5) * smoothstep(v[2], 35, 45);
    d[2] += 1 * glabella;
    d[1] -= 0.6 * glabella;
    crease(rig, i, d, {
      axis: 0,
      at: [-4.5, 4.5],
      depth: 2,
      width: 1.8,
      mask: ([, y, z]) => bump(y - 10, 5) * smoothstep(z, 38, 46),
    });
    // The crease across the top of the nose, pulled down by its muscle.
    crease(rig, i, d, {
      axis: 1,
      at: [3.5],
      depth: 1.3,
      width: 1.4,
      mask: ([x, , z]) => bump(x, 5) * smoothstep(z, 40, 48),
    });
  });
}

// The forehead's creases as the brows go up: three across it, over the
// middle (`middle` true) or over the outer brows.
const foreheadCreases = (rig, middle) => (v, i, d) =>
  crease(rig, i, d, {
    axis: 1,
    at: [19, 26, 33],
    depth: 0.9,
    width: 2,
    mask: ([x, , z]) =>
      smoothstep(z, 25, 35) *
      (middle
        ? bump(x, 14)
        : smoothstep(Math.abs(x), 13, 20) *
          (1 - smoothstep(Math.abs(x), 28, 34))),
  });

// The inner ends of the brows drawn up (and a little together), the outer
// ends staying: the brows slant up toward the middle.
// The forehead held still above the brows outside (`outer` true) or inside
// `across` of the middle, so a brow raise moves only its own part of it.
function holdForehead(rig, pins, across, outer) {
  rig.vertices.forEach((v, i) => {
    if (pins.has(i) || v[1] < 17 || v[2] < 20) return;
    if (outer ? Math.abs(v[0]) > across : Math.abs(v[0]) < across)
      pins.set(i, [0, 0, 0]);
  });
}

function browInnerUp(rig, face) {
  const pins = still(rig, { floor: BROW_FLOOR, nose: true });
  holdForehead(rig, pins, 26, true);
  lids(rig, pins, 0, 0);
  // The ridge of the brow moves too, not only the skin above it: on a face
  // without hair the ridge is what shows the brow moving.
  brows(
    rig,
    pins,
    (across) => {
      const inner = 1 - smoothstep(across, 5, 22);
      // The outer ends dip a little as the inner rise, so the brows slant.
      return [0, 9 * inner - 1 * (1 - inner), 0];
    },
    7,
  );
  return finish(rig, face, pins, foreheadCreases(rig, true));
}

// The outer ends of the brows raised: the whole brow lifts a little and its
// outer third most, as the outer part of the forehead's muscle does it.
function browOuterUp(rig, face) {
  const pins = still(rig, { floor: BROW_FLOOR, nose: true });
  lids(rig, pins, -0.08, 0);
  holdForehead(rig, pins, 6, false);
  brows(
    rig,
    pins,
    (across) => [0, 3.5 + 3.5 * smoothstep(across, 8, 26), 0],
    7,
  );
  return finish(rig, face, pins, foreheadCreases(rig, false));
}

// Where each wing of the nose (the ala) is fullest, its side's x mirrored.
const ALA = { x: 11, y: -26, z: 41 };
// The middle of each wing's lobe, round the nostril, and how far round it the
// flare reaches.
const WING = { x: 8, y: -24, z: 45, reach: 4.5 };

// The nostrils flared, as the muscle that does it pulls: each wing of the
// nose swings out, most at the middle of its lobe, so the nostril opens wider
// and rounder, and the cheek just beside the wing gives a little. The tip,
// the skin between the nostrils and the upper lip under them stay. (Hinged
// out from a point on the cheek, the flare pushed the skin of the upper lip
// under the nostrils out further than the wings themselves.)
function noseFlare(rig) {
  return rig.vertices.map((v, i) => {
    if (rig.pocket.has(i)) return [0, 0, 0];
    const side = Math.sign(v[0]) || 1;
    const across = Math.abs(v[0]);
    const wing =
      bump(
        Math.hypot(across - WING.x, v[1] - WING.y, (v[2] - WING.z) * 0.5),
        WING.reach,
      ) *
      // Clear of the tip and the skin between the nostrils.
      smoothstep(across, 3, 6) *
      // Fading out into the cheek beside the wing.
      (1 - smoothstep(across, 10, 13)) *
      // The nose's skin, not the upper lip under it.
      smoothstep(v[1], -30, -28) *
      smoothstep(v[2], 36, 40);
    return [side * 1.4 * wing, 0.3 * wing, -0.2 * wing];
  });
}

// The sneer (a nose wrinkle with the upper lip raised): the skin of the nose
// drawn up, the nose's wings lifted, the upper lip raised most above the
// eye teeth, the cheeks beside the nose pushed up into the lower lids, and
// the inner brows pulled down.
function sneer(rig, face) {
  const pins = still(rig, { seam: 0 });
  lips(rig, face, pins, (s, lower) => {
    const a = Math.abs(s);
    // The lower lip follows up a little, so the lips part only slightly.
    if (lower) return [0, 1.2 * (1 - a * a), 0.1];
    // Raised most across the eye teeth, a little less mid-lip and little at
    // the corners, so the lip's edge squares off.
    const plateau = smoothstep(a, 0.05, 0.35) * (1 - smoothstep(a, 0.6, 1));
    return [0, 0.8 + 1.8 * plateau - 0.6 * a ** 3, 0.3 * (1 - a)];
  });
  face.lips.corners.forEach((i, k) =>
    pins.set(i, [(k ? 1 : -1) * 0.2, 0.4, -0.3]),
  );
  lids(rig, pins, 0.08, 0.55);
  brows(rig, pins, (across, side) => {
    const inner = 1 - smoothstep(across, 6, 26);
    return [
      -side * 0.9 * inner * smoothstep(across, 0, 6),
      -1.8 * inner - 0.3,
      0,
    ];
  });
  return finish(rig, face, pins, (v, i, d) => {
    if (rig.pocket.has(i)) return;
    const front = smoothstep(v[2], 30, 40);
    // The skin of the nose, drawn up.
    d[1] += 1.2 * bump(Math.hypot(v[0] * 1.4, v[1] + 9), 7) * front;
    for (const side of [-1, 1]) {
      if (side * v[0] < 0) continue;
      // The muscle beside the nose lifts the wing of the nose, the upper
      // lip under it and the cheek beside it together, as one broad rise
      // (about 5 mm): lifted as separate narrow bumps, the skin between
      // them was left behind as stripes.
      const lift =
        bump(Math.hypot((v[0] - side * 11) * 0.85, v[1] + 25), 9) *
        smoothstep(v[2], 22, 32);
      d[1] += 3 * lift;
      d[2] += 0.4 * lift;
      // The wing of the nose flares out a little as it rises.
      const ala = bump(Math.hypot(v[0] - side * ALA.x, v[1] - ALA.y), 5);
      d[0] += side * 0.7 * ala * front;
      // The cheek under the eye, bunched up against the lower lid.
      const under =
        bump(Math.hypot(v[0] - side * 25, (v[1] + 9) * 1.3), 8) *
        smoothstep(v[2], 18, 30);
      d[1] += 2.2 * under;
      d[2] += 0.8 * under;
    }
    // The fold from beside the nose toward the mouth's corner, deepened.
    smileFold(rig, i, d, 1.6);
    // Creases across the top of the nose, between the eyes.
    crease(rig, i, d, {
      axis: 1,
      at: [-0.5, 4.5],
      depth: 1.3,
      width: 1.6,
      mask: ([x, , z]) => bump(x, 5) * smoothstep(z, 38, 46),
    });
  });
}

export const FACE_SHAPES = {
  blink: (rig) => blink(rig),
  browDown,
  browInnerUp,
  browOuterUp,
  noseFlare,
  sneer,
  // A wink's shut eye: the lower lid rising further to meet the upper and
  // the cheek bunched up under it. A blink and a squint laid together
  // instead turn the lower lid past the shut upper one at the corner.
  blinkTight: (rig) => blink(rig, { upperShare: 0.55, squeeze: 1 }),
};
