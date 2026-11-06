// Expressions carried onto the head from ICT-FaceKit's scanned ones (light
// stage scans of real faces, registered to one mesh; MIT, USC Institute for
// Creative Technologies: github.com/VGL-Group/ICT-FaceKit, extracted by
// scripts/head/extract-ict.mjs into ./ict). Shaped by hand, the mouth's
// rounded shapes came out as beaks and wedges; scanned, they are real lips.
//
// How: ICT's face is placed on ours by ten landmarks (eye corners, nose tip,
// mouth corners, lips, chin) and scaled, then bent onto our surface (each of
// its points pulled to our nearest, the pull evened over its mesh, until it
// lies within a millimetre). Each of our points then takes the move of the
// point of ICT's face it lies on, evened over our mesh (ours is much finer),
// the upper lip only from ICT's upper lip and the lower from its lower.

import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

import { gridOf, similarity } from './align.mjs';
import { carryDown } from './expressions.mjs';
import { smoothstep } from './faceRig.mjs';
import { add, boundaryLoops } from './mesh.mjs';
import { jawPose } from './mouthRig.mjs';

// Our expressions made from ICT's: each a mix of its shapes, by weight.
// Each at the strength it was scanned at (1), or a mix adding up to about
// that: scaled up by eye, they read as overdone.
export const ICT_SHAPES = {
  // As scanned: a real kiss pushes the lips about 8 mm forward on this head
  // (scaled up to look more like a selfie, it read as far too far).
  pucker: { mouthPucker: 1 },
  // A small round opening: the funnel narrowed by a pucker.
  mouthU: { mouthFunnel: 1, mouthPucker: 0.9 },
  mouthO: { mouthFunnel: 0.8, jawOpen: 0.3 },
  frown: { mouthFrown_L: 1, mouthFrown_R: 1 },
  cheekPuff: { cheekPuff_L: 1, cheekPuff_R: 1 },
  dimple: { mouthDimple_L: 1, mouthDimple_R: 1 },
  press: { mouthPress_L: 1, mouthPress_R: 1 },
  lipStretch: { mouthStretch_L: 1, mouthStretch_R: 1 },
  mouthLeft: { mouthLeft: 1 },
  mouthRight: { mouthRight: 1 },
};
// (The sneer, the lower lip tucked in and the jaw's own moves, the open jaw
// included (scanned, its chin swung back and collapsed on this head), stay built by
// hand, in mouthShapes.mjs and faceShapes.mjs: scanned, they barely moved,
// and blind reviewers preferred the built ones.)
// Those whose lips meet, and how far the line where they meet is set back
// between them (units): their facing lip edges are brought together. (A
// kiss's lips meet as two rounded mounds, slightly set back; pressed ones flat.)
const SEALED = { pucker: 1.2, cheekPuff: 0, press: 0, dimple: 0, frown: 0 };
// How many times each carried move is evened over our mesh.
const PASSES = 16;
// The share of a mouth expression's move the nose's bridge and tip keep.
const NOSE_KEPT = 0.3;
// How much of the nose a point is, for holding it (0 to 1): the bridge and
// tip, fading out down the lower nose to its base, which the upper lip
// carries with it. (Faded out over the nostrils alone, the lip's move folded
// them over.)
const noseHeld = ([x, y, z]) =>
  smoothstep(y, -27, -19) *
  (1 - smoothstep(y, -8, -4)) *
  (1 - smoothstep(Math.abs(x), 8, 11)) *
  smoothstep(z, 38, 42);

const sub = (a, b) => a.map((c, k) => c - b[k]);
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const size = (a) => Math.hypot(...a);

// A neighbour list of a triangle mesh.
const neighboursOf = (count, faces) => {
  const sets = Array.from({ length: count }, () => new Set());
  for (const [a, b, c] of faces) {
    sets[a].add(b).add(c);
    sets[b].add(a).add(c);
    sets[c].add(a).add(b);
  }
  return sets.map((s) => [...s]);
};
// Each field value made the average of itself and its neighbours, `passes`
// times, where `free(i)`.
const even = (field, neighbours, passes, free = () => true) => {
  let d = field;
  for (let p = 0; p < passes; p++)
    d = d.map((x, i) => {
      const near = neighbours[i];
      if (!near.length || !free(i)) return x;
      const s = [0, 0, 0];
      for (const j of near) for (let a = 0; a < 3; a++) s[a] += d[j][a];
      return x.map((c, a) => 0.5 * c + (0.5 * s[a]) / near.length);
    });
  return d;
};
// Our skin's lip edge, its lip line, and which lip a point is on (1 upper,
// -1 lower, 0 clear of the mouth).
function lipsOf(skin, neighbours) {
  const edge = new Set(boundaryLoops(skin).flat());
  const v = skin.vertices;
  const lip = [...edge].filter(
    (i) =>
      v[i][1] > -44 && v[i][1] < -33 && v[i][2] > 28 && Math.abs(v[i][0]) < 21,
  );
  const xs = lip.map((i) => v[i][0]);
  const middle = (Math.min(...xs) + Math.max(...xs)) / 2;
  const lineAt = (x) => {
    const near = lip.filter((i) => Math.abs(v[i][0] - x) < 1.2);
    return near.length
      ? near.reduce((s, i) => s + v[i][1], 0) / near.length
      : -37.8;
  };
  // A point on the edge belongs to the lip its own skin lies on.
  const edgeSide = new Map(
    lip.map((i) => [
      i,
      neighbours[i].reduce((s, j) => s + v[j][1] - v[i][1], 0) > 0 ? 1 : -1,
    ]),
  );
  const inMouth = (p) =>
    p[2] > 25 && Math.abs(p[0] - middle) < 24 && p[1] > -55 && p[1] < -25;
  const sideOf = (p, i) =>
    !inMouth(p) ? 0 : (edgeSide.get(i) ?? (p[1] > lineAt(p[0]) ? 1 : -1));
  return { edge, lip, middle, edgeSide, inMouth, sideOf, lineAt };
}

// Our landmarks, found on the skin, matching ICT's Multi-PIE 68 by number.
function ourLandmarks(skin, lips) {
  const v = skin.vertices;
  const edge = [...lips.edge].map((i) => v[i]);
  const eye = (side) =>
    edge.filter(
      (p) =>
        p[1] > -6 &&
        p[1] < 10 &&
        side * p[0] > 4 &&
        side * p[0] < 35 &&
        p[2] > 20,
    );
  const most = (ps, f) => ps.reduce((m, p) => (f(p) > f(m) ? p : m));
  const midline = (top, bottom, reach) =>
    v.filter(
      (p) =>
        Math.abs(p[0] - lips.middle) < reach &&
        p[1] < top &&
        p[1] > bottom &&
        p[2] > 20,
    );
  const [right, left] = [eye(-1), eye(1)];
  const lipPoints = lips.lip.map((i) => v[i]);
  return {
    36: most(right, (p) => -p[0]),
    39: most(right, (p) => p[0]),
    42: most(left, (p) => -p[0]),
    45: most(left, (p) => p[0]),
    30: most(midline(-10, -32, 3), (p) => p[2]),
    48: most(lipPoints, (p) => -p[0]),
    54: most(lipPoints, (p) => p[0]),
    51: most(midline(-31, -38, 1.5), (p) => p[2]),
    57: most(midline(-38, -47, 1.5), (p) => p[2]),
    // The chin's front-most point (ICT's 8 is the bottom of the chin, so its
    // front-most point is found the same way below).
    chin: most(midline(-50, -68, 2), (p) => p[2]),
  };
}

// ICT's face (./ict/face.json.gz): vertices (cm), triangles, landmarks, shapes.
const loadIct = () =>
  JSON.parse(
    zlib.gunzipSync(
      fs.readFileSync(path.join(import.meta.dirname, 'ict', 'face.json.gz')),
    ),
  );

// ICT's face fitted onto our skin: its points, placed, and how to turn its moves.
function fit(ict, skin, weights, lips) {
  const ours = ourLandmarks(skin, lips);
  const at = (k) => ict.vertices[ict.landmarks[k]];
  const chin = ict.vertices
    .filter(
      (p) =>
        Math.abs(p[0] - at(8)[0]) < 0.15 && p[1] > at(8)[1] && p[1] < at(57)[1],
    )
    .reduce((m, p) => (p[2] > m[2] ? p : m));
  const keys = [36, 39, 42, 45, 30, 48, 54, 51, 57];
  const { turn, place } = similarity(
    [...keys.map(at), chin],
    [...keys.map((k) => ours[k]), ours.chin],
  );
  let x = ict.vertices.map(place);
  const near = neighboursOf(x.length, ict.faces);
  // Which lip each of ICT's points is on, by its inner-lip landmarks 60 to 67.
  const inner = [60, 61, 62, 63, 64, 65, 66, 67].map(
    (k) => x[ict.landmarks[k]],
  );
  const ictLine = (px) => {
    const close = inner.filter((p) => Math.abs(p[0] - px) < 4);
    const set = close.length ? close : inner;
    return set.reduce((s, p) => s + p[1], 0) / set.length;
  };
  const side = x.map((p) =>
    lips.inMouth(p) ? (p[1] > ictLine(p[0]) ? 1 : -1) : 0,
  );
  const ourSide = skin.vertices.map((p, i) => lips.sideOf(p, i));
  const nearest = gridOf(skin.vertices, (i) => weights[i] >= 10);
  const face = x.map((p) => p[1] > -80 && p[2] > -5);
  for (let step = 0; step < 14; step++) {
    const pull = x.map((p, i) => {
      if (!face[i]) return [0, 0, 0];
      const [j] = nearest(
        p,
        step < 4 ? 12 : 6,
        (k) => !side[i] || !ourSide[k] || ourSide[k] === side[i],
      );
      return j < 0 ? [0, 0, 0] : sub(skin.vertices[j], p);
    });
    const smooth = even(pull, near, step < 6 ? 60 : 25);
    x = x.map((p, i) => p.map((c, a) => c + 0.7 * smooth[i][a]));
  }
  return { x, side, turn };
}

// The moves, per expression in ICT_SHAPES, of our skin and mouth pocket.
// `free(v, i)`: the skin the moves are carried on down over, from the head
// onto the neck (as the built expressions are: bustMoves, expressions.mjs).
// The moves are set in `into` ({ skinMoves, pocketMoves }), in place of any
// built ones.
export function ictMoves(skin, pocket, weights, free, into) {
  const ict = loadIct();
  const neighbours = neighboursOf(skin.vertices.length, skin.faces);
  const lips = lipsOf(skin, neighbours);
  const { x, side, turn } = fit(ict, skin, weights, lips);
  const byPoint = x.map(() => []);
  ict.faces.forEach((f, k) => f.forEach((i) => byPoint[i].push(k)));
  const nearest = gridOf(x);
  // For each of our points, the triangle of ICT's face it lies on, where on
  // it (barycentric), and how much of the move it takes (none where our
  // surface leaves ICT's, from 1.5 to 4.5 units off).
  const onTriangle = (p, f) => {
    const [a, b, c] = f.map((i) => x[i]);
    const [e0, e1, e2] = [sub(b, a), sub(c, a), sub(p, a)];
    const [d00, d01, d11, d20, d21] = [
      dot(e0, e0),
      dot(e0, e1),
      dot(e1, e1),
      dot(e2, e0),
      dot(e2, e1),
    ];
    const den = d00 * d11 - d01 * d01 || 1;
    let w = [0, (d11 * d20 - d01 * d21) / den, (d00 * d21 - d01 * d20) / den];
    w[0] = 1 - w[1] - w[2];
    w = w.map((c) => Math.max(0, c));
    const total = w[0] + w[1] + w[2] || 1;
    w = w.map((c) => c / total);
    const q = [0, 1, 2].map((k) => w[0] * a[k] + w[1] * b[k] + w[2] * c[k]);
    return { f, w, off: size(sub(p, q)) };
  };
  const corr = new Map();
  skin.vertices.forEach((p, i) => {
    // The face and head only: the shoulders stay still in a face's expression.
    if ((weights[i] < 5 && p[1] < -90) || Math.abs(p[0]) > 60) return;
    const s = lips.sideOf(p, i);
    const [j] = nearest(p, 8, (k) => !s || !side[k] || side[k] === s);
    if (j < 0) return;
    const best = byPoint[j]
      .map((k) => onTriangle(p, ict.faces[k]))
      .reduce((m, t) => (t.off < m.off ? t : m));
    const share = Math.max(0, 1 - Math.max(0, best.off - 1.5) / 3);
    if (share > 0) corr.set(i, { ...best, share });
  });
  const moved = Object.fromEntries(
    Object.keys(ict.shapes).map((name) => {
      const d = x.map(() => [0, 0, 0]);
      for (const [i, ...m] of ict.shapes[name]) d[i] = turn(m);
      return [name, d];
    }),
  );
  const pocketNear = neighboursOf(pocket.vertices.length, pocket.faces);
  const rim = new Map();
  pocket.vertices.forEach((p, i) => {
    const e = lips.lip.find((k) => size(sub(p, skin.vertices[k])) < 0.05);
    if (e !== undefined) rim.set(i, e);
  });
  const { skinMoves, pocketMoves } = into;
  for (const [name, mix] of Object.entries(ICT_SHAPES)) {
    let d = skin.vertices.map((_, i) => {
      const c = corr.get(i);
      if (!c) return [0, 0, 0];
      const m = [0, 0, 0];
      for (const [shape, weight] of Object.entries(mix))
        for (let k = 0; k < 3; k++)
          m[k] +=
            weight *
            c.w.reduce((s, w, n) => s + w * moved[shape][c.f[n]][k], 0);
      return m.map((c2) => c2 * c.share);
    });
    d = even(d, neighbours, PASSES, (i) => corr.has(i));
    d = rigidJaw(skin, d);
    if (name in SEALED) d = seal(skin, lips, d, corr, SEALED[name]);
    // Carried on down the neck (a dropped jaw folded the skin under the chin,
    // where ICT's face ends), then any fold left smoothed out.
    d = carryDown(skin, { [name]: d }, free)[name];
    d = unfold(skin, d, neighbours);
    // Evened and carried, the lips' moves crept up the nose and swung its
    // tip (pulled to one side, the mouth took the tip 7 mm with it): the
    // bridge and tip keep NOSE_KEPT of what reaches them.
    d = d.map((m, i) =>
      m.map((c) => c * (1 - (1 - NOSE_KEPT) * noseHeld(skin.vertices[i]))),
    );
    skinMoves[name] = d;
    // The pocket's rim takes the lip edge's moves; the rest settles evenly
    // between (moved point by point, its rings tore).
    let pd = pocket.vertices.map((_, i) =>
      rim.has(i) ? d[rim.get(i)] : [0, 0, 0],
    );
    for (let p = 0; p < 600; p++)
      pd = pd.map((m, i) => {
        if (rim.has(i)) return m;
        const near = pocketNear[i];
        const s = [0, 0, 0];
        for (const j of near)
          for (let a = 0; a < 3; a++) s[a] += pd[j][a] / near.length;
        return s;
      });
    pocketMoves[name] = pd;
  }
}

// The chin turned as one piece of bone: the jaw's turn about its hinge
// (jawPose) that best fits the carried moves of the chin's front, applied to
// the whole chin and jawline below the lower lip, easing into the carried
// moves toward the lip and out along the jaw. (Carried point by point, ICT's
// jaw, hinged elsewhere than ours, bent the chin back and collapsed it.)
function rigidJaw(skin, d) {
  const v = skin.vertices;
  const share = v.map(
    ([x, y, z]) =>
      smoothstep(-y, 46, 52) *
      (1 - smoothstep(-y, 74, 82)) *
      smoothstep(z, -8, 4) *
      (1 - smoothstep(Math.abs(x), 10, 50)),
  );
  const core = v.flatMap((_, i) => (share[i] > 0.6 ? [i] : []));
  if (!core.length) return d;
  const misfit = (angle) =>
    core.reduce((sum, i) => {
      const r = sub(sub(jawPose(v[i], angle), v[i]), d[i]);
      return sum + dot(r, r);
    }, 0);
  let best = 0;
  for (let a = -0.1; a <= 0.6; a += 0.005)
    if (misfit(a) < misfit(best)) best = a;
  if (Math.abs(best) < 0.01) return d;
  return d.map((m, i) => {
    if (!share[i]) return m;
    const bone = sub(jawPose(v[i], best), v[i]);
    return m.map((c, k) => c + (bone[k] - c) * share[i]);
  });
}

// Where a move turns a triangle over (its posed normal more than about 70
// degrees from its own), the moves round it evened, a little at a time,
// until none is (the transfer's last flaws: where ICT's face and ours part,
// and at the corners of the lips and nose).
function unfold(skin, d, neighbours) {
  const v = skin.vertices;
  const normal = (p, [a, b, c]) => {
    const [u, w] = [sub(p[b], p[a]), sub(p[c], p[a])];
    const n = [
      u[1] * w[2] - u[2] * w[1],
      u[2] * w[0] - u[0] * w[2],
      u[0] * w[1] - u[1] * w[0],
    ];
    return n.map((x) => x / (size(n) || 1));
  };
  const rest = skin.faces.map((f) => normal(v, f));
  for (let round = 0; round < 30; round++) {
    const posed = v.map((p, i) => add(p, d[i]));
    const bad = new Set();
    skin.faces.forEach((f, k) => {
      if (dot(normal(posed, f), rest[k]) < 0.35) f.forEach((i) => bad.add(i));
    });
    if (!bad.size) break;
    // Two rings of neighbours round each.
    for (let ring = 0; ring < 2; ring++)
      for (const i of [...bad]) for (const j of neighbours[i]) bad.add(j);
    d = even(d, neighbours, 6, (i) => bad.has(i));
  }
  return d;
}

// The facing lip edges brought together halfway (posed), the upper a little
// in front, the correction eased into each lip over about 4 units.
function seal(skin, lips, d, corr, notch) {
  const v = skin.vertices;
  const posed = (i) => add(v[i], d[i]);
  const upper = lips.lip.filter((i) => lips.edgeSide.get(i) > 0);
  const lower = lips.lip.filter((i) => lips.edgeSide.get(i) < 0);
  const fix = new Map();
  for (const [from, to, sign] of [
    [upper, lower, 1],
    [lower, upper, -1],
  ])
    for (const e of from) {
      const f = to.reduce((m, k) =>
        Math.abs(v[k][0] - v[e][0]) < Math.abs(v[m][0] - v[e][0]) ? k : m,
      );
      // Up and down only: each lip keeps its own depth, so the line where they
      // meet stays set back between them; and less toward the corners, where
      // the lips already meet.
      const gap = sub(posed(f), posed(e));
      const across =
        (v[e][0] - lips.middle) /
        (Math.max(...lips.lip.map((k) => Math.abs(v[k][0] - lips.middle))) ||
          1);
      fix.set(e, [0, (gap[1] / 2 - sign * 0.25) * (1 - across ** 4), 0]);
    }
  const half = Math.max(
    ...lips.lip.map((k) => Math.abs(v[k][0] - lips.middle)),
  );
  return d.map((m, i) => {
    if (!corr.has(i) || !lips.inMouth(v[i])) return m;
    // The line where the lips meet set back between them (`notch`), so each
    // shows as its own rounded lip, as in a side photo of a kiss.
    const across = Math.max(0, 1 - ((v[i][0] - lips.middle) / half) ** 2);
    const from = Math.abs(v[i][1] - lips.lineAt(v[i][0]));
    m = add(m, [
      0,
      0,
      -notch * Math.exp(-((from / 2.2) ** 2)) * Math.sqrt(across),
    ]);
    if (fix.has(i)) return add(m, fix.get(i));
    const s = lips.sideOf(v[i], i);
    let weight = 0;
    const sum = [0, 0, 0];
    for (const [e, f] of fix) {
      if (lips.edgeSide.get(e) !== s) continue;
      const r = size(sub(v[i], v[e]));
      if (r > 5) continue;
      const k = Math.exp(-((r / 2.2) ** 2));
      weight += k;
      for (let a = 0; a < 3; a++) sum[a] += k * f[a];
    }
    if (!weight) return m;
    const share = Math.min(1, weight);
    return m.map((c, a) => c + (sum[a] / weight) * share);
  });
}
