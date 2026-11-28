// Retriangulates a patch of a surface evenly (incremental isotropic
// remeshing, after Botsch and Kobbelt 2004): its long edges split, its short
// ones collapsed, its edges flipped so its points meet about six triangles
// each, and its points eased toward the middle of their neighbours and back
// onto the surface, over and over. Its border stays as it is.

import { add, cross, minus, scale } from './mesh.mjs';

const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const length = (a) => Math.sqrt(dot(a, a));
const key = (a, b) => (a < b ? a * 1e6 + b : b * 1e6 + a);

// The nearest point of triangle abc to p, as weights of a, b and c (Ericson,
// Real-Time Collision Detection 5.1.5).
function nearestOn(p, a, b, c) {
  const [ab, ac, ap] = [minus(b, a), minus(c, a), minus(p, a)];
  const [d1, d2] = [dot(ab, ap), dot(ac, ap)];
  if (d1 <= 0 && d2 <= 0) return [1, 0, 0];
  const bp = minus(p, b);
  const [d3, d4] = [dot(ab, bp), dot(ac, bp)];
  if (d3 >= 0 && d4 <= d3) return [0, 1, 0];
  const vc = d1 * d4 - d3 * d2;
  if (vc <= 0 && d1 >= 0 && d3 <= 0) {
    const v = d1 / (d1 - d3);
    return [1 - v, v, 0];
  }
  const cp = minus(p, c);
  const [d5, d6] = [dot(ab, cp), dot(ac, cp)];
  if (d6 >= 0 && d5 <= d6) return [0, 0, 1];
  const vb = d5 * d2 - d1 * d6;
  if (vb <= 0 && d2 >= 0 && d6 <= 0) {
    const w = d2 / (d2 - d6);
    return [1 - w, 0, w];
  }
  const va = d3 * d6 - d5 * d4;
  if (va <= 0 && d4 - d3 >= 0 && d5 - d6 >= 0) {
    const w = (d4 - d3) / (d4 - d3 + (d5 - d6));
    return [0, 1 - w, w];
  }
  const sum = va + vb + vc;
  return [va / sum, vb / sum, vc / sum];
}

// Every whole-number triple from `low` to `high`, both counted.
function* triples(low, high) {
  for (let x = low[0]; x <= high[0]; x++)
    for (let y = low[1]; y <= high[1]; y++)
      for (let z = low[2]; z <= high[2]; z++) yield [x, y, z];
}

// Looks up the nearest place on a surface to a point: the triangle and the
// weights of its corners there.
export function surfaceOf(vertices, faces, cell) {
  const grid = new Map();
  const cellOf = (p) => p.map((c) => Math.floor(c / cell));
  faces.forEach((face, f) => {
    const corners = face.map((i) => vertices[i]);
    const [low, high] = [Math.min, Math.max].map((pick) =>
      cellOf([0, 1, 2].map((axis) => pick(...corners.map((p) => p[axis])))),
    );
    for (const at of triples(low, high)) {
      const key = at.join();
      if (!grid.has(key)) grid.set(key, []);
      grid.get(key).push(f);
    }
  });
  const placeOn = (p, face) => {
    const [a, b, c] = faces[face].map((i) => vertices[i]);
    const weights = nearestOn(p, a, b, c);
    const at = add(
      scale(a, weights[0]),
      scale(b, weights[1]),
      scale(c, weights[2]),
    );
    return { distance: length(minus(p, at)), face, weights, at };
  };
  return (p) => {
    const middle = cellOf(p);
    let best = { distance: Infinity };
    for (
      let reach = 1;
      reach <= 3 && best.distance > cell * (reach - 1);
      reach++
    ) {
      const [low, high] = [-reach, reach].map((by) =>
        middle.map((c) => c + by),
      );
      for (const at of triples(low, high))
        for (const face of grid.get(at.join()) ?? []) {
          const place = placeOn(p, face);
          if (place.distance < best.distance) best = place;
        }
    }
    return best;
  };
}

// The patch `faces` of `vertices` retriangulated, its edges about `size(p)`
// long at p: new points (the border's first, as `border` maps them) and
// triangles. `border` is the old index of each border point kept.
export function remesh({ vertices, faces }, size, passes = 10) {
  const project = surfaceOf(vertices, faces, 4);
  // Renumbered: the points of the patch only.
  const numbers = new Map();
  const points = [];
  const old = [];
  const number = (i) => {
    if (!numbers.has(i)) {
      numbers.set(i, points.length);
      points.push(vertices[i]);
      old.push(i);
    }
    return numbers.get(i);
  };
  let tris = faces.map((face) => face.map(number));
  const edgesOf = () => {
    const edges = new Map();
    tris.forEach((tri, t) => {
      if (!tri) return;
      for (let k = 0; k < 3; k++) {
        const at = key(tri[k], tri[(k + 1) % 3]);
        if (!edges.has(at))
          edges.set(at, { a: tri[k], b: tri[(k + 1) % 3], tris: [] });
        edges.get(at).tris.push(t);
      }
    });
    return edges;
  };
  const fixed = new Set();
  for (const { a, b, tris: on } of edgesOf().values())
    if (on.length === 1) fixed.add(a).add(b);
  const wanted = (a, b) => (size(points[a]) + size(points[b])) / 2;
  const far = (a, b) => length(minus(points[a], points[b]));
  const around = () => {
    const out = points.map(() => new Set());
    tris.forEach((tri, t) => tri?.forEach((i) => out[i].add(t)));
    return out;
  };
  const normal = ([a, b, c]) =>
    cross(minus(points[b], points[a]), minus(points[c], points[a]));

  const split = () => {
    for (const { a, b, tris: on } of [...edgesOf().values()].sort(
      (p, q) => far(q.a, q.b) - far(p.a, p.b),
    )) {
      if (on.length !== 2 || far(a, b) < (4 / 3) * wanted(a, b)) continue;
      if (on.some((t) => !tris[t]?.includes(a) || !tris[t].includes(b)))
        continue;
      const m = points.push(scale(add(points[a], points[b]), 0.5)) - 1;
      old.push(-1);
      for (const t of on) {
        const tri = tris[t];
        tris[t] = tri.map((i) => (i === b ? m : i));
        tris.push(tri.map((i) => (i === a ? m : i)));
      }
    }
  };
  // The points round point `i`, given the triangles `near` each point.
  const ring = (near, i) =>
    new Set([...near[i]].flatMap((t) => tris[t] ?? []).filter((j) => j !== i));
  // Moves points a and b together, into a if it is on the border or else to
  // the middle of the two. Put back, and false, if that folds a triangle over
  // or makes an edge too long.
  const join = (near, a, b) => {
    const [ra, rb] = [ring(near, a), ring(near, b)];
    // Only where the surface stays one sheet.
    if (!ra.has(b) || [...ra].filter((i) => rb.has(i)).length !== 2)
      return false;
    const moved = [...new Set([...near[a], ...near[b]])].filter(
      (t) => tris[t] && !(tris[t].includes(a) && tris[t].includes(b)),
    );
    const before = moved.map((t) => normal(tris[t]));
    const keep = [points[a], points[b]];
    const at = fixed.has(a) ? points[a] : scale(add(points[a], points[b]), 0.5);
    points[a] = at;
    points[b] = at;
    const folds = moved.some((t, k) => {
      const n = normal(tris[t]);
      return dot(n, before[k]) <= 0.2 * length(n) * length(before[k]);
    });
    const stretches = [...rb].some(
      (i) => i !== a && far(a, i) > (4 / 3) * wanted(a, i),
    );
    if (folds || stretches) [points[a], points[b]] = keep;
    return !folds && !stretches;
  };
  // Has every triangle of b's be a's, and those of both be gone.
  const merge = (near, a, b) => {
    for (const t of near[b]) {
      if (!tris[t]) continue;
      if (tris[t].includes(a)) {
        tris[t] = null;
        continue;
      }
      tris[t] = tris[t].map((i) => (i === b ? a : i));
      near[a].add(t);
    }
  };
  const collapse = () => {
    const near = around();
    const gone = new Set();
    const edges = [...edgesOf().values()].sort(
      (p, q) => far(p.a, p.b) - far(q.a, q.b),
    );
    for (const edge of edges) {
      // Into a border point, if either is one.
      const [a, b] = fixed.has(edge.b) ? [edge.b, edge.a] : [edge.a, edge.b];
      if (edge.tris.length !== 2 || gone.has(a) || gone.has(b)) continue;
      if (fixed.has(b) || far(a, b) > (4 / 5) * wanted(a, b)) continue;
      if (!join(near, a, b)) continue;
      merge(near, a, b);
      gone.add(b);
    }
    tris = tris.filter(Boolean);
  };
  const flip = () => {
    const valence = points.map(() => 0);
    const edges = edgesOf();
    for (const { a, b } of edges.values()) {
      valence[a]++;
      valence[b]++;
    }
    const want = (i) => (fixed.has(i) ? 4 : 6);
    const off = (i, by) => (valence[i] + by - want(i)) ** 2;
    const touched = new Set();
    for (const { a, b, tris: on } of edges.values()) {
      if (on.length !== 2 || on.some((t) => touched.has(t))) continue;
      const [t, u] = on;
      const c = tris[t].find((i) => i !== a && i !== b);
      const d = tris[u].find((i) => i !== a && i !== b);
      if (edges.has(key(c, d))) continue;
      const now = off(a, 0) + off(b, 0) + off(c, 0) + off(d, 0);
      const then = off(a, -1) + off(b, -1) + off(c, 1) + off(d, 1);
      if (then >= now) continue;
      // Round each new triangle the way the old ones went.
      const k = tris[t].indexOf(a);
      const forward = tris[t][(k + 1) % 3] === b;
      const [one, two] = forward
        ? [
            [a, d, c],
            [d, b, c],
          ]
        : [
            [a, c, d],
            [d, c, b],
          ];
      const n = add(normal(tris[t]), normal(tris[u]));
      if (
        [one, two].some(
          (tri) => dot(normal(tri), n) <= 0.3 * length(normal(tri)) * length(n),
        )
      )
        continue;
      tris[t] = one;
      tris[u] = two;
      touched.add(t).add(u);
      edges.set(key(c, d), { a: c, b: d, tris: [t, u] });
      valence[a]--;
      valence[b]--;
      valence[c]++;
      valence[d]++;
    }
  };
  const relax = () => {
    const near = around();
    const moved = points.map((p, i) => {
      if (fixed.has(i) || !near[i].size) return p;
      let sum = [0, 0, 0];
      let total = 0;
      for (const t of near[i]) {
        const tri = tris[t];
        const weight = length(normal(tri));
        const middle = scale(add(...tri.map((j) => points[j])), 1 / 3);
        sum = add(sum, scale(middle, weight));
        total += weight;
      }
      return project(scale(sum, 1 / total)).at;
    });
    moved.forEach((p, i) => (points[i] = p));
  };
  for (let pass = 0; pass < passes; pass++) {
    split();
    collapse();
    flip();
    flip();
    relax();
  }
  // Each point left, as a place on the old surface.
  const used = new Map();
  const places = [];
  const out = tris.map((tri) =>
    tri.map((i) => {
      if (!used.has(i)) {
        used.set(i, places.length);
        if (fixed.has(i))
          places.push({
            corners: [old[i], old[i], old[i]],
            weights: [1, 0, 0],
          });
        else {
          const { face, weights } = project(points[i]);
          places.push({ corners: faces[face], weights });
        }
      }
      return used.get(i);
    }),
  );
  return { places, faces: out };
}
