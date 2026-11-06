// The back of the neck and the top of the trapezius, seen from the side,
// shaped to a side photo (the subject standing relaxed, arms down: the
// outline traced from it with the photo's head lined up on the scan's head).
// The photo's neck runs straight down, turns over about 13 units into the
// trapezius, and runs on to the shoulder in one even slope (as a shirtless
// walk-around video shows too). MakeHuman's bust stood 4 to 6 units out
// behind that shape just under the neck: a knob at the top of the trapezius.
//
// The back is moved forward or back by a few broad swells and hollows
// (BLOBS: rows down the back at the midline and over each trapezius, mirrored,
// each falling away over `width`), their depths fitted by least squares so the
// side outline lies on the photo's shape between FIT.top and FIT.bottom, and
// the middle of the back of the neck lies level with the skin beside it
// (LEVEL: MakeHuman dips there over the spine, which showed from behind as a
// dark triangle). Being broad, they cannot carve a ridge or a dent; fitted
// point by point, the back took grooves, ridges and a shelf. The photo's
// shape is held to the bust's own outline at both ends, where the photo and
// the scan differ by the subject's posture (about 5 units under the head).

import fs from 'node:fs';
import path from 'node:path';

// The photo's outline, [height, how far back] in head.bin units every 2.8
// units down it (photoBack.json, read by headBust.test.ts too).
const PHOTO_BACK = JSON.parse(
  fs.readFileSync(path.join(import.meta.dirname, 'photoBack.json'), 'utf8'),
);
const FIT = { top: -50, bottom: -108, step: 2, rounds: 4, damping: 0.05 };
// Neighbouring blobs (8 units apart down the back, or side by side) are kept
// close in depth, `even` times over: fitted freely, they alternated in and
// out and left a faint line across the base of the neck.
const NEIGHBOURS = { apart: 23, even: 0.5 };
const BLOBS = [
  ...[-56, -64, -72, -80, -88, -96, -104, -112].flatMap((y) =>
    [0, 22, 40].map((x) => ({ x, y, width: 14 })),
  ),
  // Narrower ones over the dip at the base of the neck.
  ...[-84, -92, -100].map((y) => ({ x: 0, y, width: 8 })),
];
const LEVEL = { top: -82, bottom: -102, beside: 10, weight: 4 };
// Where the outline passes from the middle of the neck to the trapezius it
// turned more sharply than the photo's does anywhere (22 degrees in 3 units
// against 20): there its bend, each unit down, is also fitted to the photo
// shape's, `weight` times over.
const TURN = { top: -62, bottom: -80, weight: 3 };

const smoothstep = (x, low, high) => {
  const t = Math.min(Math.max((x - low) / (high - low), 0), 1);
  return t * t * (3 - 2 * t);
};
const axisZ = (y) => -25 + (y + 72) * 0.43;

// The photo's outline at height y, between its traced points.
const photoAt = (y) => {
  const k = PHOTO_BACK.findIndex(([h]) => h < y);
  const [[h0, z0], [h1, z1]] = [PHOTO_BACK[k - 1], PHOTO_BACK[k]];
  return z0 + ((z1 - z0) * (y - h0)) / (h1 - h0);
};

// The back-most point where the edges cross height y.
const outline = (vertices, edges, y) => {
  let back = Infinity;
  for (const [a, b] of edges) {
    const [p, q] = [vertices[a], vertices[b]];
    if ((p[1] - y) * (q[1] - y) > 0 || p[1] === q[1]) continue;
    back = Math.min(back, p[2] + ((y - p[1]) / (q[1] - p[1])) * (q[2] - p[2]));
  }
  return back;
};

// The back-most skin within 2.5 units of height y and of `x` from the
// midline, behind the neck.
const depthAt = (vertices, x, y) => {
  let back = Infinity;
  for (const [vx, vy, vz] of vertices)
    if (Math.abs(vy - y) < 2.5 && Math.abs(Math.abs(vx) - x) < 2.5)
      if (vz < axisZ(vy)) back = Math.min(back, vz);
  return back;
};

// Least squares: the depths d minimizing |J d - r|^2 + damping |d|^2.
const solve = (columns, residual, damping) => {
  const m = columns.length;
  const a = columns.map((ci, i) =>
    columns.map(
      (cj, j) =>
        ci.reduce((s, v, t) => s + v * cj[t], 0) +
        (i === j ? damping * residual.length : 0),
    ),
  );
  const g = columns.map((c) => c.reduce((s, v, t) => s + v * residual[t], 0));
  for (let i = 0; i < m; i++) {
    let p = i;
    for (let k = i + 1; k < m; k++)
      if (Math.abs(a[k][i]) > Math.abs(a[p][i])) p = k;
    [a[i], a[p], g[i], g[p]] = [a[p], a[i], g[p], g[i]];
    for (let k = i + 1; k < m; k++) {
      const f = a[k][i] / a[i][i];
      for (let j = i; j < m; j++) a[k][j] -= f * a[i][j];
      g[k] -= f * g[i];
    }
  }
  const d = new Array(m).fill(0);
  for (let i = m - 1; i >= 0; i--) {
    let s = g[i];
    for (let j = i + 1; j < m; j++) s -= a[i][j] * d[j];
    d[i] = s / a[i][i];
  }
  return d;
};

export function fitBack(start, faces) {
  // Each blob's move of each point, at depth 1: straight back or forward,
  // on the skin behind the neck's axis.
  const behind = start.map(([x, y, z]) => {
    const out = z - axisZ(y);
    return smoothstep(-out / (Math.hypot(x, out) || 1), 0.2, 0.8);
  });
  const shapes = BLOBS.map(({ x: bx, y: by, width }) =>
    start.map(
      ([x, y], i) =>
        behind[i] *
        Math.exp(-((Math.abs(x) - bx) ** 2 + (y - by) ** 2) / width ** 2),
    ),
  );
  const moved = (depths) =>
    start.map(([x, y, z], i) => [
      x,
      y,
      z + depths.reduce((s, d, k) => s + d * shapes[k][i], 0),
    ]);
  // Only the back's edges can make its outline.
  const edges = faces.flatMap((f) =>
    f.flatMap((a, k) => {
      const b = f[(k + 1) % f.length];
      return start[a][2] < -30 && start[b][2] < -30 ? [[a, b]] : [];
    }),
  );
  const heights = [];
  for (let y = FIT.top; y >= FIT.bottom; y -= FIT.step) heights.push(y);
  const levels = [];
  for (let y = LEVEL.top; y >= LEVEL.bottom; y -= FIT.step) levels.push(y);
  // What the fit wants to be zero: the outline less the photo's shape, and
  // the middle's depth less the depth beside it.
  const at = heights.map((y) => outline(start, edges, y));
  const last = heights.length - 1;
  const shift = [0, last].map((k) => at[k] - photoAt(heights[k]));
  let farthest = Infinity;
  const target = heights.map((y, k) => {
    farthest = Math.min(
      farthest,
      photoAt(y) + shift[0] + ((shift[1] - shift[0]) * k) / last,
    );
    return farthest;
  });
  const targetAt = (y) => {
    const k = (FIT.top - y) / FIT.step;
    const f = Math.floor(k);
    return target[f] + (target[Math.min(f + 1, last)] - target[f]) * (k - f);
  };
  const turns = [];
  for (let y = TURN.top; y >= TURN.bottom; y--) turns.push(y);
  const bend = (z, y) => z(y + 3) - 2 * z(y) + z(y - 3);
  const misfit = (points) => [
    ...heights.map((y, k) => outline(points, edges, y) - target[k]),
    ...turns.map(
      (y) =>
        TURN.weight *
        (bend((h) => outline(points, edges, h), y) - bend(targetAt, y)),
    ),
    ...levels.map(
      (y) =>
        LEVEL.weight *
        (depthAt(points, 0, y) - depthAt(points, LEVEL.beside, y)),
    ),
  ];
  let depths = BLOBS.map(() => 0);
  for (let round = 0; round < FIT.rounds; round++) {
    const base = misfit(moved(depths));
    const columns = BLOBS.map((_, k) => {
      const nudged = depths.map((d, j) => d + (j === k ? 1 : 0));
      return misfit(moved(nudged)).map((v, t) => v - base[t]);
    });
    // Each pair of neighbours adds a row asking their depths to be equal.
    const pairs = BLOBS.flatMap((p, k) =>
      BLOBS.flatMap((q, j) =>
        j > k &&
        p.width === q.width &&
        Math.hypot(p.x - q.x, p.y - q.y) < NEIGHBOURS.apart
          ? [[k, j]]
          : [],
      ),
    );
    const step = solve(
      columns.map((c, k) => [
        ...c,
        ...pairs.map(([a, b]) =>
          a === k ? NEIGHBOURS.even : b === k ? -NEIGHBOURS.even : 0,
        ),
      ]),
      [
        ...base.map((v) => -v),
        ...pairs.map(([a, b]) => -NEIGHBOURS.even * (depths[a] - depths[b])),
      ],
      FIT.damping,
    );
    depths = depths.map((d, k) => d + step[k]);
  }
  return moved(depths);
}
