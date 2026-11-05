// Looking down, the back of the neck runs from the skull to the shoulders in
// one even curve, as the skin stretches taut over the spine (a side photo,
// looking down). Bent by the shader alone (components/Background/
// headTurn.ts), the skull tipped forward over a nape that stayed upright, so
// the back of the neck stood out as a column above a corner at the shoulders.
// This is the neckDown shape's part that fills it: the nodded head's outline
// down the back, between LINE.top and LINE.bottom (heights once nodded, in
// head.bin units), is set to a curve that leans back steadily more, from the
// outline's own lean at the top to its own lean at the bottom, and the skin
// behind the neck is moved to it. The move is made in the nodded pose and
// turned back to the still one, since the shapes go on before the shader
// turns them.

import { smoothstep } from './faceRig.mjs';

const LINE = { top: -14, bottom: -86 };
// How far round the neck the move reaches: all of it straight behind the
// neck's axis, none where the skin faces more than `from` of the way to the
// side (by the cosine of its angle from straight back).
const AROUND = { from: 0.2, full: 0.8 };
// Within this distance of the midline, the outline as seen from the side.
const MIDDLE = 30;

// The neck's nod when the shape is full (components/Background/neckPose.ts
// FULL_NOD, less the body's share: headTurn.ts BODY_SHARE) and the shader's
// neck (headTurn.ts): keep these in step with it.
const FULL_NOD = 0.52 * 0.85;
const PIVOT = [0, -28, -22];
const NECK_BASE = [0, -120, -45.6];
const TUCK = 0.6;
const SKULL = [-95, -52];
const NAPE_BACK = [5, -50];
const NAPE_HEIGHT = [-50, -28];

// How far a point at rest turns about x, nodded fully down: the skull's
// share at its joint and the neck's bend, both about x (headTurn.ts).
const turnOf = ([, y, z], weight) => {
  const nape =
    smoothstep(z, ...NAPE_BACK) * (1 - smoothstep(y, ...NAPE_HEIGHT));
  const skull = FULL_NOD * TUCK * weight * smoothstep(y, ...SKULL) * (1 - nape);
  return { skull, neck: FULL_NOD * (1 - TUCK) * weight };
};
const turnX = ([x, y, z], a, [, cy, cz] = [0, 0, 0]) => [
  x,
  cy + (y - cy) * Math.cos(a) - (z - cz) * Math.sin(a),
  cz + (y - cy) * Math.sin(a) + (z - cz) * Math.cos(a),
];
// A point nodded fully down, as the shader nods it: turned about the skull's
// joint by its share, then carried along the neck's even bend.
const nodded = (p, weight) => {
  const { skull, neck } = turnOf(p, weight);
  const t = turnX(p, skull, PIVOT);
  const axis = [1, 2].map((k) => PIVOT[k] - NECK_BASE[k]);
  const length = Math.hypot(...axis);
  const [ay, az] = axis.map((c) => c / length);
  const s = weight * length;
  const total = FULL_NOD * (1 - TUCK);
  const along = total ? (Math.sin(neck) * length) / total : s;
  const aside = total ? ((1 - Math.cos(neck)) * length) / total : 0;
  // The neck's side direction, x crossed with its axis.
  const [sy, sz] = [-az, ay];
  const from = [0, NECK_BASE[1] + ay * s, NECK_BASE[2] + az * s];
  const [rx, ry, rz] = turnX([t[0], t[1] - from[1], t[2] - from[2]], neck);
  return [
    rx,
    NECK_BASE[1] + ay * along + sy * aside + ry,
    NECK_BASE[2] + az * along + sz * aside + rz,
  ];
};

// The farthest back the skin reaches at height y, near the midline.
const outline = (vertices, faces, y) => {
  let back = Infinity;
  for (const face of faces) {
    if (face.some((i) => Math.abs(vertices[i][0]) > MIDDLE)) continue;
    for (let e = 0; e < 3; e++) {
      const p = vertices[face[e]];
      const q = vertices[face[(e + 1) % 3]];
      if ((p[1] - y) * (q[1] - y) > 0 || p[1] === q[1]) continue;
      back = Math.min(
        back,
        p[2] + ((y - p[1]) / (q[1] - p[1])) * (q[2] - p[2]),
      );
    }
  }
  return back;
};

// Each point's move, at rest, for the neckDown shape.
export function napeLine(skin, weights) {
  const posed = skin.vertices.map((p, i) => nodded(p, weights[i]));
  const back = (y) => outline(posed, skin.faces, y);
  const { top, bottom } = LINE;
  const span = top - bottom;
  const [zTop, zBottom] = [back(top), back(bottom)];
  const lean = [back(top + 2) - zTop, zBottom - back(bottom - 2)].map((d) =>
    Math.atan2(d, 2),
  );
  // The curve's lean, from the top's to the bottom's as s goes 0 to 1, rising
  // as s to the power `rate`, chosen so it ends at the outline's own bottom.
  const steps = 200;
  const drop = (rate, to = 1) => {
    let d = 0;
    for (let k = 0; k < steps; k++) {
      const s = ((k + 0.5) / steps) * to;
      d +=
        (Math.tan(lean[0] + (lean[1] - lean[0]) * s ** rate) * span * to) /
        steps;
    }
    return d;
  };
  let [low, high] = [0.2, 8];
  for (let k = 0; k < 50; k++) {
    const mid = (low + high) / 2;
    if (drop(mid) > zTop - zBottom) low = mid;
    else high = mid;
  }
  const rate = (low + high) / 2;
  const gap = Array.from(
    { length: span + 1 },
    (_, k) => zTop - drop(rate, k / span) - back(top - k),
  );
  const gapAt = (y) => {
    const k = top - y;
    if (k <= 0 || k >= span) return 0;
    const f = Math.floor(k);
    return gap[f] + (gap[f + 1] - gap[f]) * (k - f);
  };
  const axisZ = (y) => -25 + (y + 72) * 0.43;
  return skin.vertices.map((p, i) => {
    const out = p[2] - axisZ(p[1]);
    const facing = -out / (Math.hypot(p[0], out) || 1);
    const move =
      gapAt(posed[i][1]) * smoothstep(facing, AROUND.from, AROUND.full);
    const { skull, neck } = turnOf(p, weights[i]);
    return turnX([0, 0, move], -(skull + neck));
  });
}
