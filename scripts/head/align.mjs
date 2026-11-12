// Placing one scanned surface on another: used to carry ICT-FaceKit's face
// (scripts/head/ict.mjs) and MHR's neck (scripts/head/mhr.mjs) onto ours.

import { add, dot, minus as sub } from './mesh.mjs';

// Points by cell, for nearest-point searches.
export const gridOf = (points, keep = () => true, cell = 2) => {
  const cells = new Map();
  const key = (p) => p.map((c) => Math.floor(c / cell)).join(',');
  points.forEach((p, i) => {
    if (!keep(i)) return;
    const k = key(p);
    (cells.get(k) ?? cells.set(k, []).get(k)).push(i);
  });
  // The points in the cells within `reach` cells of p's.
  const around = (p, reach) => {
    const [gx, gy, gz] = p.map((c) => Math.floor(c / cell));
    const near = [];
    for (let x = -reach; x <= reach; x++)
      for (let y = -reach; y <= reach; y++)
        for (let z = -reach; z <= reach; z++)
          near.push(...(cells.get(`${gx + x},${gy + y},${gz + z}`) ?? []));
    return near;
  };
  // The nearest point to p within r that `ok(i)` allows, and its distance.
  return (p, r, ok = () => true) => {
    let best = -1;
    let bestD = r * r;
    for (const i of around(p, Math.ceil(r / cell))) {
      if (!ok(i)) continue;
      const d = dot(sub(points[i], p), sub(points[i], p));
      if (d < bestD) [bestD, best] = [d, i];
    }
    return [best, Math.sqrt(bestD)];
  };
};

// The rotation, scale and shift best taking points `from` onto `to` (Umeyama).
export function similarity(from, to) {
  const mean = (ps) =>
    [0, 1, 2].map((k) => ps.reduce((s, p) => s + p[k], 0) / ps.length);
  const [mf, mt] = [mean(from), mean(to)];
  const cov = [0, 1, 2].map(() => [0, 0, 0]);
  let spread = 0;
  from.forEach((p, i) => {
    const [a, b] = [sub(p, mf), sub(to[i], mt)];
    spread += dot(a, a);
    for (let r = 0; r < 3; r++)
      for (let c = 0; c < 3; c++) cov[r][c] += b[r] * a[c];
  });
  const T = (m) => m[0].map((_, c) => m.map((r) => r[c]));
  const mul = (a, b) =>
    a.map((r) => b[0].map((_, c) => r.reduce((s, x, k) => s + x * b[k][c], 0)));
  // The singular vectors of cov, from the eigenvectors of covᵀcov (Jacobi).
  let m = mul(T(cov), cov);
  let v = [
    [1, 0, 0],
    [0, 1, 0],
    [0, 0, 1],
  ];
  for (let sweep = 0; sweep < 50; sweep++)
    for (const [p, q] of [
      [0, 1],
      [0, 2],
      [1, 2],
    ]) {
      if (Math.abs(m[p][q]) < 1e-14) continue;
      const theta = (m[q][q] - m[p][p]) / (2 * m[p][q]);
      const t =
        Math.sign(theta || 1) / (Math.abs(theta) + Math.hypot(theta, 1));
      const [c, s] = [1 / Math.hypot(t, 1), t / Math.hypot(t, 1)];
      const j = [
        [1, 0, 0],
        [0, 1, 0],
        [0, 0, 1],
      ];
      [j[p][p], j[q][q], j[p][q], j[q][p]] = [c, c, s, -s];
      m = mul(mul(T(j), m), j);
      v = mul(v, j);
    }
  const order = [0, 1, 2].sort((a, b) => m[b][b] - m[a][a]);
  v = v.map((r) => order.map((k) => r[k]));
  const sigma = order.map((k) => Math.sqrt(Math.max(m[k][k], 0)));
  const cv = mul(cov, v);
  const u = cv.map((r) => r.map((x, k) => x / (sigma[k] || 1)));
  const det = (a) =>
    a[0][0] * (a[1][1] * a[2][2] - a[1][2] * a[2][1]) -
    a[0][1] * (a[1][0] * a[2][2] - a[1][2] * a[2][0]) +
    a[0][2] * (a[1][0] * a[2][1] - a[1][1] * a[2][0]);
  const flip = [1, 1, Math.sign(det(cov)) || 1];
  const rotation = mul(
    mul(
      u,
      flip.map((f, k) => [0, 1, 2].map((c) => (c === k ? f : 0))),
    ),
    T(v),
  );
  const scale = sigma.reduce((s, x, k) => s + x * flip[k], 0) / spread;
  const turn = (d) => [0, 1, 2].map((k) => scale * dot(rotation[k], d));
  const shift = sub(mt, turn(mf));
  return { turn, place: (p) => add(turn(p), shift) };
}
