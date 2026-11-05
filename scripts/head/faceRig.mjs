// What every expression (scripts/head/expressions.mjs and the files beside
// it) is built from: the face set up for posing, and the moves its muscles
// make. A few points are pinned (lip edges, eyelid rims, brow line, chin),
// and every other point takes the smooth blend between them (a harmonic
// field), so the movement spreads through the face instead of bunching at the
// pins. Distances are in head.bin units (about 1.7 mm).

import { boundaryLoops, normals } from './mesh.mjs';

export const smoothstep = (x, low, high) => {
  const t = Math.min(Math.max((x - low) / (high - low), 0), 1);
  return t * t * (3 - 2 * t);
};
export const bump = (d, width) => Math.exp(-((d / width) ** 2));
export const length = (v) => Math.hypot(...v);
export const minus = (a, b) => a.map((c, axis) => c - b[axis]);

// A turn of p about the axis through c parallel to x (positive tips forward
// points down).
export const turn = (p, c, angle) => {
  const dy = p[1] - c[1];
  const dz = p[2] - c[2];
  return [
    p[0],
    c[1] + dy * Math.cos(angle) - dz * Math.sin(angle),
    c[2] + dy * Math.sin(angle) + dz * Math.cos(angle),
  ];
};

// The jaw's hinge, in front of the ears.
export const HINGE = [0, -12, -14];
// The eyeballs' radius (myHead.obj's leftEye and rightEye).
export const EYE_RADIUS = 7.72;

export function setUp(face, eyes, height) {
  const { vertices } = face;
  const faces = [...face.skinFaces, ...face.pocketFaces];
  const neighbours = vertices.map(() => new Set());
  for (const f of faces)
    f.forEach((a, k) => {
      const b = f[(k + 1) % f.length];
      neighbours[a].add(b);
      neighbours[b].add(a);
    });
  const rims = boundaryLoops({ vertices, faces: face.skinFaces })
    .filter((loop) => Math.abs(vertices[loop[0]][1]) < 10)
    .map((loop) => {
      const points = loop.map((i) => vertices[i]);
      const centre = eyes.find(
        (e) => Math.sign(e[0]) === Math.sign(points[0][0]),
      );
      const xs = points.map((p) => p[0]);
      const low = Math.min(...xs);
      const high = Math.max(...xs);
      const [a, b] = [low, high].map((x) => points[xs.indexOf(x)]);
      // Above the line through the eye's corners is the upper lid.
      const line = (x) => a[1] + ((x - low) * (b[1] - a[1])) / (high - low);
      // How far along the lid a point is: 1 mid-lid, 0 at the corners.
      const arc = (x) => 1 - ((2 * (x - low)) / (high - low) - 1) ** 2;
      return { loop, centre, line, arc };
    });
  const [left, right] = face.lips.corners.map((i) => vertices[i][0]);
  const mouth = { middle: (left + right) / 2, half: (right - left) / 2 };
  const normal = normals({
    vertices,
    faces: faces.flatMap((f) =>
      f.slice(1, -1).map((_, k) => [f[0], f[k + 1], f[k + 2]]),
    ),
  });
  // The mouth pocket's own points (not on the lip edge).
  const onSkin = new Set(face.skinFaces.flat());
  const pocket = new Set(face.pocketFaces.flat().filter((i) => !onSkin.has(i)));
  return { vertices, neighbours, rims, mouth, normal, height, eyes, pocket };
}

// The displacement of every point: `pins` fixes some (index -> [dx, dy, dz]);
// the rest blend smoothly between them, then are evened out, except points
// held by `hard`.
export function field({ vertices, neighbours }, pins, hard) {
  let d = vertices.map((_, i) => pins.get(i) ?? [0, 0, 0]);
  for (let pass = 0; pass < 1500; pass++)
    d = d.map((own, i) => {
      if (pins.has(i) || neighbours[i].size === 0) return own;
      const sum = [0, 0, 0];
      for (const j of neighbours[i])
        for (let a = 0; a < 3; a++) sum[a] += d[j][a];
      return sum.map((c) => c / neighbours[i].size);
    });
  for (let pass = 0; pass < 30; pass++)
    d = d.map((own, i) => {
      if (hard.has(i) || neighbours[i].size === 0) return own;
      const sum = [0, 0, 0];
      for (const j of neighbours[i])
        for (let a = 0; a < 3; a++) sum[a] += d[j][a];
      return own.map((c, a) => 0.5 * c + (0.5 * sum[a]) / neighbours[i].size);
    });
  return d;
}

// How much of the nose a point is, 0 to 1: its bridge, tip and wings, from
// below its root (where the skin between the brows moves) down to the base
// of the nostrils, out to where the wings meet the cheeks. The bridge and tip
// are bone and cartilage: an expression that does not work the nose's own
// muscles leaves them where they are.
export const onNose = ([x, y, z]) =>
  smoothstep(y, -28.5, -26) *
  (1 - smoothstep(y, -8, -4)) *
  (1 - smoothstep(Math.abs(x), 8, 10.5)) *
  smoothstep(z, 38, 41);

// Points that stay still: the back of the head, the crown (above `crown`),
// the ears, the skin near the neck below `seam` units over the join, anything
// below `floor`, and with `nose` the nose (onNose), so an expression around
// it (the brows raised, the lips pushed out) does not drag it along.
export function still(
  rig,
  { crown = 58, seam = 4, floor = -Infinity, nose = false } = {},
) {
  const pins = new Map();
  rig.vertices.forEach((v, i) => {
    if (
      v[2] < -10 ||
      v[1] > crown ||
      v[1] < floor ||
      Math.abs(v[0]) > 44 ||
      rig.height(v) < seam ||
      (nose && onNose(v) > 0.5)
    )
      pins.set(i, [0, 0, 0]);
  });
  return pins;
}

// Each eyelid rim turns over the eyeball about its centre: the upper lid by
// `upper`, the lower by `lower` (radians; positive closes), most mid-lid.
export function lids(rig, pins, upper, lower) {
  for (const { loop, centre, line, arc } of rig.rims)
    for (const i of loop) {
      const p = rig.vertices[i];
      const angle = (p[1] > line(p[0]) ? upper : -lower) * arc(p[0]);
      pins.set(i, minus(turn(p, centre, angle), p));
    }
}

// The brow line (from `low` up) moves by `move(|x|, sign of x)`.
export function brows(rig, pins, move, low = 11) {
  rig.vertices.forEach((v, i) => {
    if (pins.has(i) || v[1] < low || v[1] > 14 || v[2] < 25) return;
    const across = Math.abs(v[0]);
    if (across < 34) pins.set(i, move(across, Math.sign(v[0]) || 1));
  });
}

// The pins' field, the lip edges and eyelid rims held exactly where they
// were pinned; then `extra(v, i, move)` may add to each other point's move.
export function finish(rig, face, pins, extra) {
  const hard = new Set(
    [...pins].filter(([, d]) => length(d) === 0).map(([i]) => i),
  );
  for (const { loop } of rig.rims) loop.forEach((i) => hard.add(i));
  const { upper, lower, corners } = face.lips;
  for (const i of [...upper, ...lower, ...corners]) hard.add(i);
  const d = field(rig, pins, hard);
  if (extra) rig.vertices.forEach((v, i) => !hard.has(i) && extra(v, i, d[i]));
  return d;
}

// Lip edge points move with the corners, more the nearer the corner; `move`
// gives each point's move from its place along the lip (-1 to 1) and side.
export function lips(rig, face, pins, move) {
  const { middle, half } = rig.mouth;
  for (const [list, lower] of [
    [face.lips.upper, false],
    [face.lips.lower, true],
  ])
    for (const i of list) {
      const s = (rig.vertices[i][0] - middle) / half;
      pins.set(i, move(s, lower, i));
    }
}

// Creases in point i's skin, added to its move `d`: shallow grooves `depth`
// deep (into the skin, along its normal), one at each of `at` (places along
// `axis`, 0 across or 1 up), each `width` wide, where `mask(v)` (0 to 1)
// allows. On the glossy skin even a half-millimetre groove shows as a line.
export function crease(rig, i, d, { axis, at, depth, width, mask }) {
  const v = rig.vertices[i];
  const w = mask(v) * at.reduce((sum, c) => sum + bump(v[axis] - c, width), 0);
  for (let k = 0; k < 3; k++) d[k] -= depth * w * rig.normal[i][k];
}

// The fold from beside each wing of the nose down past the mouth's corner,
// deepened by `depth` in point i's move `d` (smiles, sneers and wide mouths
// all deepen it).
export function smileFold(rig, i, d, depth) {
  const v = rig.vertices[i];
  const side = Math.sign(v[0]) || 1;
  const [top, bottom] = [
    [side * 11, -22],
    [side * 17, -37],
  ];
  const run = minus(bottom, top);
  const span = length(run);
  const along =
    ((v[0] - top[0]) * run[0] + (v[1] - top[1]) * run[1]) / span ** 2;
  const across = ((v[0] - top[0]) * run[1] - (v[1] - top[1]) * run[0]) / span;
  // A soft fold, about a centimetre across, the cheek side rising out of it
  // (carved narrow, it read as a cut line between the nose and the mouth).
  const fold =
    depth *
    (bump(across, 5) - 0.35 * bump(across - 6, 5)) *
    smoothstep(along, -0.2, 0.15) *
    (1 - smoothstep(along, 0.85, 1.2)) *
    smoothstep(v[2], 25, 35);
  for (let k = 0; k < 3; k++) d[k] -= fold * rig.normal[i][k];
}
