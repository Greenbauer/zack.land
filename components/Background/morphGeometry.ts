import { BufferAttribute, BufferGeometry } from 'three';

import { decodeHead, type HeadMesh } from './headGeometry';
import { SHOWN_EXPRESSIONS, SHOWN_SIDED } from './shownExpressions';
import { withSides } from './sideMorphs';

// The head's geometry, built once from its file. Not in a useMemo: the
// scene's Suspense throws away a render while any sibling is still loading
// (the sky, the grading, the title's font), and a memo goes with it, so the
// build ran again as each of them came in, five times on a first visit.
const built = new WeakMap<
  ArrayBuffer,
  { geometry: Record<string, BufferGeometry>; expressions: string[] }
>();
export function builtHead(file: ArrayBuffer) {
  let head = built.get(file);
  if (!head) {
    // The expressions the page shows (shownExpressions.ts), with one-sided
    // brows and squints (sideMorphs.ts) for ambient.ts.
    const { meshes, expressions } = withSides(
      decodeHead(file, SHOWN_EXPRESSIONS),
      SHOWN_SIDED,
    );
    const geometry: Record<string, BufferGeometry> = {};
    for (const [name, part] of meshes) geometry[name] = morphGeometry(part);
    head = { geometry, expressions };
    built.set(file, head);
  }
  return head;
}

// One of the head's meshes as MyHead.tsx draws it: its geometry, with each
// expression as a morph target (its moves, and the turn of each normal they
// cause, worked out here once), and the head and turn weights the shader
// reads (headTurn.ts).
export function morphGeometry(part: HeadMesh): BufferGeometry {
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new BufferAttribute(part.positions, 3));
  geometry.setAttribute('normal', new BufferAttribute(part.normals, 3));
  geometry.setIndex(new BufferAttribute(part.indices, 1));
  geometry.setAttribute(
    'headWeight',
    new BufferAttribute(part.headWeights, 1, true),
  );
  geometry.setAttribute(
    'turnWeight',
    new BufferAttribute(part.turnWeights, 1, true),
  );
  if (part.morphs.some((morph) => morph.indices.length)) {
    const turns = normalTurns(part);
    geometry.morphAttributes.position = part.morphs.map(
      ({ indices, moves }) => {
        const dense = new Float32Array(part.positions.length);
        indices.forEach((v, k) =>
          dense.set(moves.subarray(k * 3, k * 3 + 3), v * 3),
        );
        return new BufferAttribute(dense, 3);
      },
    );
    geometry.morphAttributes.normal = turns.map(
      (turn) => new BufferAttribute(turn, 3),
    );
    geometry.morphTargetsRelative = true;
  }
  return geometry;
}

// How each expression turns the normals: its shape's normals less the rest
// shape's, as three's computeVertexNormals has them (each vertex's the
// normalized sum of its triangles' unnormalized normals). An expression moves
// a part of the skin, so only the triangles touching a moved vertex are
// worked out again, and only their vertices' normals change: the whole mesh
// worked out for each of its forty-odd expressions took the page's main
// thread a third of a second on a fast laptop, and more on a phone.
function normalTurns(part: HeadMesh) {
  const { positions, indices, morphs } = part;
  const shape = { ...part, ...restNormals(part), ...trianglesAround(part) };
  const work = {
    posed: new Float32Array(positions),
    seenTriangle: new Int32Array(indices.length / 3).fill(-1),
    seenVertex: new Int32Array(positions.length / 3).fill(-1),
    change: new Float64Array(positions.length),
  };
  return morphs.map((morph, m) => {
    const { indices: at, moves } = morph;
    at.forEach((v, k) => {
      for (let axis = 0; axis < 3; axis++)
        work.posed[v * 3 + axis] =
          positions[v * 3 + axis]! + moves[k * 3 + axis]!;
    });
    const turn = turnOf(shape, work, at, m);
    for (const v of at)
      work.posed.set(positions.subarray(v * 3, v * 3 + 3), v * 3);
    return turn;
  });
}

type Shape = HeadMesh &
  ReturnType<typeof restNormals> &
  ReturnType<typeof trianglesAround>;
type Work = {
  posed: Float32Array;
  seenTriangle: Int32Array;
  seenVertex: Int32Array;
  change: Float64Array;
};

// The turn of the normals for morph `m`, whose moved vertices `at` are
// already moved in `work.posed`: the sum at each vertex of a triangle that
// touches one, less those triangles' rest normals and plus their posed ones,
// normalized, less the rest normal.
function turnOf(shape: Shape, work: Work, at: Uint16Array, m: number) {
  const { indices, faces, starts, around } = shape;
  const { seenTriangle, seenVertex, change } = work;
  const moved = new Float32Array(3);
  const touched: number[] = [];
  const add = (u: number, t: number) => {
    if (seenVertex[u] !== m) {
      seenVertex[u] = m;
      touched.push(u);
      change.fill(0, u * 3, u * 3 + 3);
    }
    for (let axis = 0; axis < 3; axis++)
      change[u * 3 + axis]! += moved[axis]! - faces[t * 3 + axis]!;
  };
  for (const v of at)
    for (let k = starts[v]!; k < starts[v + 1]!; k++) {
      const t = around[k]!;
      if (seenTriangle[t] === m) continue;
      seenTriangle[t] = m;
      faceNormal(indices, work.posed, t, moved, 0);
      for (let corner = 0; corner < 3; corner++)
        add(indices[t * 3 + corner]!, t);
    }
  return turnsAt(shape, change, touched);
}

function turnsAt(
  { positions, sums, rest }: Shape,
  change: Float64Array,
  touched: number[],
) {
  const turn = new Float32Array(positions.length);
  for (const u of touched) {
    const i = u * 3;
    unitInto(
      sums[i]! + change[i]!,
      sums[i + 1]! + change[i + 1]!,
      sums[i + 2]! + change[i + 2]!,
      turn,
      i,
    );
    for (let axis = 0; axis < 3; axis++) turn[i + axis]! -= rest[i + axis]!;
  }
  return turn;
}

// Each triangle's normal at rest (unnormalized, as three has it), their sum
// at each vertex, and each vertex's normal at rest.
function restNormals({ positions, indices }: HeadMesh) {
  const faces = new Float32Array(indices.length);
  const sums = new Float64Array(positions.length);
  for (let t = 0; t < indices.length / 3; t++) {
    faceNormal(indices, positions, t, faces, t * 3);
    for (let corner = 0; corner < 3; corner++) {
      const v = indices[t * 3 + corner]! * 3;
      for (let axis = 0; axis < 3; axis++)
        sums[v + axis]! += faces[t * 3 + axis]!;
    }
  }
  const rest = new Float32Array(positions.length);
  for (let v = 0; v < positions.length / 3; v++)
    unitInto(sums[v * 3]!, sums[v * 3 + 1]!, sums[v * 3 + 2]!, rest, v * 3);
  return { faces, sums, rest };
}

// The triangles at each vertex v: around[starts[v]] to around[starts[v + 1]].
function trianglesAround({ positions, indices }: HeadMesh) {
  const vertices = positions.length / 3;
  const starts = new Uint32Array(vertices + 1);
  for (const v of indices) starts[v + 1]!++;
  for (let v = 0; v < vertices; v++) starts[v + 1]! += starts[v]!;
  const around = new Uint32Array(indices.length);
  const filled = starts.slice(0, vertices);
  indices.forEach((v, k) => (around[filled[v]!++] = Math.floor(k / 3)));
  return { starts, around };
}

// Triangle t's normal, as three's computeVertexNormals works it out:
// (c - b) x (a - b), unnormalized.
function faceNormal(
  indices: Uint16Array,
  p: ArrayLike<number>,
  t: number,
  out: Float32Array,
  at: number,
) {
  const a = indices[t * 3]! * 3;
  const b = indices[t * 3 + 1]! * 3;
  const c = indices[t * 3 + 2]! * 3;
  const cbx = p[c]! - p[b]!;
  const cby = p[c + 1]! - p[b + 1]!;
  const cbz = p[c + 2]! - p[b + 2]!;
  const abx = p[a]! - p[b]!;
  const aby = p[a + 1]! - p[b + 1]!;
  const abz = p[a + 2]! - p[b + 2]!;
  out[at] = cby * abz - cbz * aby;
  out[at + 1] = cbz * abx - cbx * abz;
  out[at + 2] = cbx * aby - cby * abx;
}

function unitInto(
  x: number,
  y: number,
  z: number,
  out: Float32Array,
  at: number,
) {
  const length = Math.hypot(x, y, z) || 1;
  out[at] = x / length;
  out[at + 1] = y / length;
  out[at + 2] = z / length;
}
