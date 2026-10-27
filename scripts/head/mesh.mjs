// Small triangle-mesh helpers for scripts/build-head.mjs. A mesh is
// { vertices: [x, y, z][], faces: number[][] } (triangles or quads).

export const add = (...points) =>
  points.reduce((sum, p) => sum.map((c, axis) => c + p[axis]), [0, 0, 0]);
export const scale = (p, s) => p.map((c) => c * s);
export const average = (points) => scale(add(...points), 1 / points.length);
const minus = (a, b) => a.map((c, axis) => c - b[axis]);
const cross = (u, w) => [
  u[1] * w[2] - u[2] * w[1],
  u[2] * w[0] - u[0] * w[2],
  u[0] * w[1] - u[1] * w[0],
];

const edgeKey = (a, b) => (a < b ? `${a}_${b}` : `${b}_${a}`);

// Merges vertices closer than `epsilon`, renumbering faces and dropping faces
// that collapse.
export function weld({ vertices, faces }, epsilon = 1e-4) {
  const map = new Map();
  const merged = [];
  const index = vertices.map((v) => {
    const key = v.map((c) => Math.round(c / epsilon)).join();
    if (!map.has(key)) {
      map.set(key, merged.length);
      merged.push(v);
    }
    return map.get(key);
  });
  const welded = faces
    .map((face) => face.map((i) => index[i]))
    .filter((face) => new Set(face).size === face.length);
  return { vertices: merged, faces: welded };
}

// Splits every polygon into a fan of triangles.
export const triangulate = ({ vertices, faces }) => ({
  vertices,
  faces: faces.flatMap((f) =>
    f.slice(1, -1).map((_, k) => [f[0], f[k + 1], f[k + 2]]),
  ),
});

// One Catmull-Clark step on a mesh of polygons (it returns all quads). Open
// edges keep the boundary rules, so cut edges stay where they are.
export function subdivide({ vertices, faces }) {
  const facePoints = faces.map((face) => average(face.map((i) => vertices[i])));
  const edges = new Map();
  faces.forEach((polygon, face) =>
    polygon.forEach((a, k) => {
      const b = polygon[(k + 1) % polygon.length];
      const key = edgeKey(a, b);
      if (!edges.has(key)) edges.set(key, { a, b, faces: [] });
      edges.get(key).faces.push(face);
    }),
  );
  const out = [...vertices];
  const edgeIndex = new Map();
  for (const [key, { a, b, faces: around }] of edges) {
    edgeIndex.set(key, out.length);
    const ends = [vertices[a], vertices[b]];
    out.push(
      around.length === 2
        ? average([...ends, ...around.map((f) => facePoints[f])])
        : average(ends),
    );
  }
  const touching = vertices.map(() => ({ faces: [], edges: [], open: [] }));
  faces.forEach((polygon, face) =>
    polygon.forEach((i) => touching[i].faces.push(face)),
  );
  for (const edge of edges.values())
    for (const [end, other] of [
      [edge.a, edge.b],
      [edge.b, edge.a],
    ]) {
      touching[end].edges.push(edge);
      if (edge.faces.length === 1) touching[end].open.push(other);
    }
  touching.forEach(({ faces: around, edges: spokes, open }, i) => {
    const p = vertices[i];
    if (open.length === 2)
      out[i] = scale(
        add(scale(p, 6), vertices[open[0]], vertices[open[1]]),
        1 / 8,
      );
    else if (open.length === 0 && spokes.length >= 3) {
      const n = spokes.length;
      const f = average(around.map((face) => facePoints[face]));
      const r = average(
        spokes.map(({ a, b }) => average([vertices[a], vertices[b]])),
      );
      out[i] = scale(add(f, scale(r, 2), scale(p, n - 3)), 1 / n);
    }
  });
  const faceIndex = facePoints.map((point) => out.push(point) - 1);
  const subdivided = faces.flatMap((polygon, face) =>
    polygon.map((v, k) => [
      v,
      edgeIndex.get(edgeKey(v, polygon[(k + 1) % polygon.length])),
      faceIndex[face],
      edgeIndex.get(
        edgeKey(polygon[(k + polygon.length - 1) % polygon.length], v),
      ),
    ]),
  );
  return { vertices: out, faces: subdivided };
}

// Cuts a triangle mesh along the surface side(p) = 0, keeping side(p) > 0.
// Crossing triangles are clipped exactly; the cut's new vertices are shared
// between neighbours, so the result is watertight up to its new boundary.
// `origin` gives each result vertex's source: [a, b, t], the point t of the
// way from input vertex a to b (b = a for a vertex kept as it was).
export function clip({ vertices, faces }, side) {
  const out = [...vertices];
  const origin = vertices.map((_, i) => [i, i, 0]);
  const values = vertices.map(side);
  const crossings = new Map();
  const crossing = (a, b) => {
    const key = edgeKey(a, b);
    if (!crossings.has(key)) {
      const t = values[a] / (values[a] - values[b]);
      origin.push([a, b, t]);
      crossings.set(
        key,
        out.push(add(vertices[a], scale(minus(vertices[b], vertices[a]), t))) -
          1,
      );
    }
    return crossings.get(key);
  };
  const kept = [];
  for (const tri of faces) {
    const inside = tri.map((i) => values[i] > 0);
    const count = inside.filter(Boolean).length;
    if (count === 3) kept.push(tri);
    if (count === 0 || count === 3) continue;
    // Rotate so the lone vertex (inside when count is 1, outside when 2) is first.
    const lone = inside.findIndex((v) => v === (count === 1));
    const [a, b, c] = [0, 1, 2].map((k) => tri[(lone + k) % 3]);
    const ab = crossing(a, b);
    const ac = crossing(a, c);
    if (count === 1) kept.push([a, ab, ac]);
    else kept.push([ab, b, c], [ab, c, ac]);
  }
  const result = compact({ vertices: out, faces: kept });
  return { ...result, origin: result.kept.map((i) => origin[i]) };
}

// Drops unused vertices. `kept` lists each result vertex's input index.
export function compact({ vertices, faces }) {
  const renumber = new Map();
  const used = [];
  const renumbered = faces.map((face) =>
    face.map((i) => {
      if (!renumber.has(i)) {
        renumber.set(i, used.length);
        used.push(vertices[i]);
      }
      return renumber.get(i);
    }),
  );
  return { vertices: used, faces: renumbered, kept: [...renumber.keys()] };
}

// The mesh's open edges, chained into closed loops of vertex indices.
export function boundaryLoops({ faces }) {
  const count = new Map();
  for (const face of faces)
    face.forEach((a, k) => {
      const b = face[(k + 1) % face.length];
      count.set(edgeKey(a, b), (count.get(edgeKey(a, b)) ?? 0) + 1);
    });
  const next = new Map();
  for (const face of faces)
    face.forEach((a, k) => {
      const b = face[(k + 1) % face.length];
      if (count.get(edgeKey(a, b)) === 1) next.set(a, b);
    });
  const loops = [];
  const seen = new Set();
  for (const start of next.keys()) {
    if (seen.has(start)) continue;
    const loop = [];
    for (let v = start; v !== undefined && !seen.has(v); v = next.get(v)) {
      seen.add(v);
      loop.push(v);
    }
    loops.push(loop);
  }
  return loops;
}

// The connected piece of a mesh that contains vertex `seed`.
export function component({ vertices, faces }, seed) {
  const touching = vertices.map(() => []);
  faces.forEach((face, f) => face.forEach((i) => touching[i].push(f)));
  const reached = new Set([seed]);
  const queue = [seed];
  const keptFaces = new Set();
  while (queue.length) {
    for (const f of touching[queue.pop()]) {
      if (keptFaces.has(f)) continue;
      keptFaces.add(f);
      for (const i of faces[f])
        if (!reached.has(i)) {
          reached.add(i);
          queue.push(i);
        }
    }
  }
  return compact({ vertices, faces: faces.filter((_, f) => keptFaces.has(f)) });
}

// Laplacian smoothing of the vertices `weights` names (0 to 1 each). Taubin
// style (a shrink step undone by a swell step) keeps the overall shape but
// also keeps a sharp turn; plain smoothing rounds a turn off, shrinking a
// little where it works.
export function smooth({ vertices, faces }, weights, passes, taubin = true) {
  const neighbours = vertices.map(() => new Set());
  for (const face of faces)
    face.forEach((a, k) => {
      const b = face[(k + 1) % face.length];
      neighbours[a].add(b);
      neighbours[b].add(a);
    });
  let current = vertices;
  for (let pass = 0; pass < passes; pass++)
    for (const factor of taubin ? [0.5, -0.53] : [0.5])
      current = current.map((v, i) => {
        const w = weights.get(i);
        if (!w || neighbours[i].size === 0) return v;
        const centre = average([...neighbours[i]].map((j) => current[j]));
        return add(v, scale(minus(centre, v), factor * w));
      });
  return { vertices: current, faces };
}

// Smooth vertex normals, each face weighted by its area.
export function normals({ vertices, faces }) {
  const sums = vertices.map(() => [0, 0, 0]);
  for (const face of faces) {
    const n = cross(
      minus(vertices[face[1]], vertices[face[0]]),
      minus(vertices[face[2]], vertices[face[0]]),
    );
    for (const i of face) sums[i] = add(sums[i], n);
  }
  return sums.map((n) => scale(n, 1 / (Math.hypot(...n) || 1)));
}
