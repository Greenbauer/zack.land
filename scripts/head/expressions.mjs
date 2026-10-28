// The face's expressions, each a displacement of every point of the scan's
// skin and mouth pocket (scripts/head/mouth.mjs), matched to reference photos
// lined up on the pupils. Each is built from what its muscles do: a few moves
// are pinned (lip edges, eyelid rims, brow line, chin), and every other point
// takes the smooth blend between them (a harmonic field), so the movement
// spreads through the face instead of bunching at the pins. Distances are in
// head.bin units (about 1.7 mm).

import { add, boundaryLoops, normals, scale } from "./mesh.mjs";

const smoothstep = (x, low, high) => {
  const t = Math.min(Math.max((x - low) / (high - low), 0), 1);
  return t * t * (3 - 2 * t);
};
const bump = (d, width) => Math.exp(-((d / width) ** 2));
const length = (v) => Math.hypot(...v);
const minus = (a, b) => a.map((c, axis) => c - b[axis]);

// A turn of p about the axis through c parallel to x (positive tips forward
// points down).
const turn = (p, c, angle) => {
  const dy = p[1] - c[1];
  const dz = p[2] - c[2];
  return [
    p[0],
    c[1] + dy * Math.cos(angle) - dz * Math.sin(angle),
    c[2] + dy * Math.sin(angle) + dz * Math.cos(angle),
  ];
};

// The jaw's hinge, in front of the ears.
const HINGE = [0, -12, -14];
// How far the skin round a smiling mouth corner follows it.
const CORNER_REACH = 6;

function setUp(face, eyes, height) {
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
  return { vertices, neighbours, rims, mouth, normal, height };
}

// The displacement of every point: `pins` fixes some (index -> [dx, dy, dz]);
// the rest blend smoothly between them, then are evened out, except points
// held by `hard`.
function field({ vertices, neighbours }, pins, hard) {
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

// Points that stay still: the back of the head, the crown, the ears, and the
// skin near the neck below `seam` units over the join.
function still(rig, { crown = 58, seam = 4 } = {}) {
  const pins = new Map();
  rig.vertices.forEach((v, i) => {
    if (
      v[2] < -10 ||
      v[1] > crown ||
      Math.abs(v[0]) > 44 ||
      rig.height(v) < seam
    )
      pins.set(i, [0, 0, 0]);
  });
  return pins;
}

// Each eyelid rim turns over the eyeball about its centre: the upper lid by
// `upper`, the lower by `lower` (radians; positive closes), most mid-lid.
function lids(rig, pins, upper, lower) {
  for (const { loop, centre, line, arc } of rig.rims)
    for (const i of loop) {
      const p = rig.vertices[i];
      const angle = (p[1] > line(p[0]) ? upper : -lower) * arc(p[0]);
      pins.set(i, minus(turn(p, centre, angle), p));
    }
}

// The brow line moves by `move(|x|, sign of x)`.
function brows(rig, pins, move) {
  rig.vertices.forEach((v, i) => {
    if (pins.has(i) || v[1] < 11 || v[1] > 14 || v[2] < 25) return;
    const across = Math.abs(v[0]);
    if (across < 34) pins.set(i, move(across, Math.sign(v[0]) || 1));
  });
}

function finish(rig, face, pins, extra) {
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
function lips(rig, face, pins, move) {
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

// The smile (reference: a broad grin): the corners pull out, up and back
// toward the cheekbones, the lips part in a crescent, the cheeks bunch up and
// forward to a fold from beside the nose past the mouth corner, and the lower
// lids rise into a squint.
function smile(rig, face) {
  const pins = still(rig, { crown: 40 });
  const [OUT, UP, BACK] = [4.5, 4.5, 3];
  lips(rig, face, pins, (s, lower) => {
    const a = Math.abs(s);
    const middle = lower ? -1.2 : 1;
    const rise = middle + (UP - middle) * a ** (lower ? 1.6 : 2.5);
    return [Math.sign(s) * OUT * a, rise, -BACK * a ** 1.5];
  });
  const corners = face.lips.corners.map((i, k) => {
    const move = [(k ? 1 : -1) * OUT, UP, -BACK];
    pins.set(i, move);
    return { at: rig.vertices[i], move };
  });
  lids(rig, pins, 0.08, 0.35);
  return finish(rig, face, pins, (v, i, d) => {
    // The skin round each corner goes with it, fading over about a
    // centimetre, so the cheek beside the corner is not squeezed over it.
    for (const { at, move } of corners) {
      const w = bump(length(minus(v, at)), CORNER_REACH);
      for (let k = 0; k < 3; k++) d[k] += (move[k] - d[k]) * w;
    }
    for (const side of [-1, 1]) {
      if (side * v[0] < 0) continue;
      const front = smoothstep(v[2], 15, 28);
      // The fold, from beside the nose to past the mouth corner: `across` is
      // the distance out from it, `along` 0 to 1 down it.
      const [a, b] = [
        [side * 11, -22],
        [side * 19, -42],
      ];
      const dir = minus(b, a);
      const span = length(dir);
      const along =
        ((v[0] - a[0]) * dir[0] + (v[1] - a[1]) * dir[1]) / span ** 2;
      const across =
        (((v[0] - a[0]) * dir[1] - (v[1] - a[1]) * dir[0]) / span) * -side;
      const cheek =
        6 *
        bump(Math.hypot(v[0] - side * 25, v[1] + 26), 12) *
        front *
        smoothstep(across, -0.5, 3);
      const crease =
        1.2 *
        bump(across - 0.5, 1.6) *
        smoothstep(along, -0.3, 0.1) *
        (1 - smoothstep(along, 0.9, 1.3)) *
        front;
      const n = rig.normal[i];
      for (let k = 0; k < 3; k++)
        d[k] +=
          cheek *
            (0.6 * n[k] + (k === 1 ? 0.7 : 0) + (k === 0 ? side * 0.15 : 0)) -
          crease * n[k];
      // Crow's feet gather at the outer eye corner.
      const crow =
        bump(Math.hypot(v[0] - side * 32, v[1] - 2), 6) *
        smoothstep(v[2], 5, 20);
      d[0] -= side * 0.8 * crow;
      d[1] += 0.5 * crow;
    }
  });
}

// Shared by the two surprises: brows up (inner ends by `inner` of it), the
// lids open, the jaw turned down by `jaw`.
function surprise(
  rig,
  face,
  { lid, lowerLid, inner, jaw, upperLip, out, seam, brow = 4.5 },
) {
  const pins = still(rig, { seam });
  lids(rig, pins, -lid, -lowerLid);
  brows(rig, pins, (across) => [
    0,
    brow *
      (inner + (1 - inner) * smoothstep(across, 4, 14)) *
      (1 - smoothstep(across, 26, 34)),
    0,
  ]);
  const { middle, half } = rig.mouth;
  // The lips part in an oval: full in the middle, easing to the corners.
  const oval = (x) => Math.max(0, 1 - ((x - middle) / half) ** 2) ** 0.6;
  lips(rig, face, pins, (s, lower, i) => {
    const p = rig.vertices[i];
    if (!lower) return [0, upperLip * oval(p[0]), 0];
    return minus(turn(p, HINGE, jaw), p).map((c) => c * oval(p[0]));
  });
  face.lips.corners.forEach((i, k) => {
    const p = rig.vertices[i];
    const d = minus(turn(p, HINGE, jaw * 0.25), p);
    pins.set(i, [d[0] + (k ? 1 : -1) * out, d[1], d[2] - 0.5]);
  });
  // The chin and the underside of the jaw turn down with it.
  if (jaw)
    rig.vertices.forEach((v, i) => {
      if (pins.has(i) || v[1] > -50 || v[2] < 0 || Math.abs(v[0]) > 22) return;
      if (rig.height(v) > 4) pins.set(i, minus(turn(v, HINGE, jaw), v));
    });
  return finish(rig, face, pins);
}

// Wide-eyed (reference: eyes nearly doubled, brows up, mouth closed).
const wide = (rig, face) =>
  surprise(rig, face, {
    lid: 0.7,
    lowerLid: 0.25,
    inner: 0.8,
    jaw: 0,
    upperLip: 0,
    out: 0,
    seam: 4,
  });

// Gasp (reference: brows up with their inner ends, the jaw dropped into an
// oval). Its jaw reaches the neck, so nothing near the join is held here: the
// build carries it on down the throat (headExpressions in build-head.mjs).
const gasp = (rig, face) =>
  surprise(rig, face, {
    lid: 0.15,
    lowerLid: 0.05,
    inner: 1,
    jaw: 0.28,
    upperLip: 1.5,
    out: 2,
    seam: -12,
  });

// Pout (reference: lips pushed forward, the lower lip up, corners down, chin
// lifted and bunched, inner brows drawn down and together, eyes narrowed).
function pout(rig, face) {
  const pins = still(rig, { seam: 0 });
  lips(rig, face, pins, (s, lower, i) => {
    const body = 1 - s * s;
    const x = rig.vertices[i][0] - rig.mouth.middle;
    return [
      -x * 0.12 * body,
      (lower ? 0.2 : -0.3) * body - 1.8 * s * s,
      3.5 * body + (lower ? 0.5 : 0),
    ];
  });
  for (const i of face.lips.corners) pins.set(i, [0, -1.8, -0.5]);
  rig.vertices.forEach((v, i) => {
    if (
      !pins.has(i) &&
      v[1] < -52 &&
      v[2] > 20 &&
      Math.abs(v[0]) < 14 &&
      rig.height(v) > 8
    )
      pins.set(i, [0, 1.8, 1.2]);
  });
  lids(rig, pins, 0.1, 0.12);
  brows(rig, pins, (across, side) => {
    const near = 1 - smoothstep(across, 6, 26);
    return [-side * 1.6 * near, -2.2 * near - 0.3, 0];
  });
  return finish(rig, face, pins);
}

// Brows up, as when looking at something above: the brows and forehead lift
// about 5 mm and the upper lids open a little; the mouth stays still.
const browsUp = (rig, face) =>
  surprise(rig, face, {
    lid: 0.12,
    lowerLid: 0,
    inner: 0.7,
    jaw: 0,
    upperLip: 0,
    out: 0,
    seam: 4,
    brow: 3,
  });

// A squint, as when focusing on something far away: the lower lids rise and
// the upper lids come down, the brows lower and draw in a little, and the
// cheeks under the eyes lift; the mouth stays still.
function squint(rig, face) {
  const pins = still(rig);
  lips(rig, face, pins, () => [0, 0, 0]);
  for (const i of face.lips.corners) pins.set(i, [0, 0, 0]);
  lids(rig, pins, 0.12, 0.4);
  brows(rig, pins, (across, side) => {
    const inner = 1 - smoothstep(across, 6, 26);
    return [-side * 0.6 * inner, -1.2 * inner - 0.4, 0];
  });
  return finish(rig, face, pins, (v, i, d) => {
    for (const side of [-1, 1]) {
      if (side * v[0] < 0) continue;
      const cheek =
        bump(Math.hypot(v[0] - side * 20, v[1] + 10), 7) *
        smoothstep(v[2], 15, 28);
      d[1] += 1.2 * cheek;
      const crow =
        bump(Math.hypot(v[0] - side * 32, v[1] - 2), 6) *
        smoothstep(v[2], 5, 20);
      d[0] -= side * 0.6 * crow;
    }
  });
}

// Worried (reference: the inner ends of the brows drawn up and together
// while their outer ends stay, the lips pressed and the mouth's corners
// turned down, the chin a little bunched): the eyes stay as they are, but
// for the lower lids tightening a touch.
function worried(rig, face) {
  const pins = still(rig, { seam: 0 });
  lids(rig, pins, 0, 0.08);
  brows(rig, pins, (across, side) => {
    const inner = 1 - smoothstep(across, 5, 24);
    return [-side * 1.2 * inner, 4.6 * inner - 0.8 * (1 - inner), 0];
  });
  lips(rig, face, pins, (s, lower) => {
    const body = 1 - s * s;
    return [0, -1.9 * s * s + (lower ? 0.5 : -0.1) * body, 0.4 * body];
  });
  face.lips.corners.forEach((i, k) =>
    pins.set(i, [(k ? 1 : -1) * 0.5, -2.5, -0.4]),
  );
  rig.vertices.forEach((v, i) => {
    if (
      !pins.has(i) &&
      v[1] < -52 &&
      v[2] > 20 &&
      Math.abs(v[0]) < 14 &&
      rig.height(v) > 8
    )
      pins.set(i, [0, 0.9, 0.6]);
  });
  return finish(rig, face, pins);
}

export const EXPRESSIONS = {
  smile,
  wide,
  gasp,
  pout,
  browsUp,
  squint,
  worried,
};

// Every expression's displacement of the face's points, by name. `eyes` are
// the eyeballs' centres; `height(p)` is a point's height over the join.
export function expressions(face, eyes, height) {
  const rig = setUp(face, eyes, height);
  return Object.fromEntries(
    Object.entries(EXPRESSIONS).map(([name, build]) => [
      name,
      build(rig, face),
    ]),
  );
}

// Carries expressions on down the neck: `moves` (name -> per-vertex move, set
// on the head's points and zero elsewhere) are evened out over the points
// `free(v, i)` allows (the skin near the join and the throat), the rest held,
// so a dropped jaw stretches the throat smoothly instead of creasing at the
// join.
export function carryDown({ vertices, faces }, moves, free) {
  const neighbours = vertices.map(() => []);
  for (const f of faces)
    f.forEach((a, k) => {
      const b = f[(k + 1) % f.length];
      neighbours[a].push(b);
      neighbours[b].push(a);
    });
  const open = vertices.flatMap((v, i) => (free(v, i) ? [i] : []));
  return Object.fromEntries(
    Object.entries(moves).map(([name, start]) => {
      const d = start.map((m) => [...m]);
      for (let pass = 0; pass < 600; pass++)
        for (const i of open) {
          const sum = [0, 0, 0];
          for (const j of neighbours[i])
            for (let a = 0; a < 3; a++) sum[a] += d[j][a];
          for (let a = 0; a < 3; a++) d[i][a] = sum[a] / neighbours[i].length;
        }
      return [name, d];
    }),
  );
}

// Each expression's moves on the joined bust: a head point carries its fine
// point's move (a point on the cut, its edge's blend) and the moves are
// carried on down the neck over the points `free` allows; the mouth pocket's
// points carry theirs as they are.
export function bustMoves({ head, skin, pocket, fineMoves, free }) {
  const onHead = Object.fromEntries(
    Object.entries(fineMoves).map(([name, m]) => [
      name,
      skin.vertices.map((_, i) => {
        if (i >= head.vertices.length) return [0, 0, 0];
        const [a, b, t] = head.origin[i];
        return add(scale(m[a], 1 - t), scale(m[b], t));
      }),
    ]),
  );
  return {
    skinMoves: carryDown(skin, onHead, free),
    pocketMoves: Object.fromEntries(
      Object.entries(fineMoves).map(([name, m]) => [
        name,
        pocket.kept.map((i) => m[i]),
      ]),
    ),
  };
}
