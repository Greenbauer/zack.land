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
function normalTurns({ positions, indices, morphs }: HeadMesh) {
  const vertices = positions.length / 3;
  const triangles = indices.length / 3;
  // Each triangle's normal at rest, and their sum at each vertex.
  const faces = new Float32Array(indices.length);
  const sums = new Float64Array(positions.length);
  const face = (p: ArrayLike<number>, t: number, out: Float32Array, at = 0) => {
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
  };
  for (let t = 0; t < triangles; t++) {
    face(positions, t, faces, t * 3);
    for (let corner = 0; corner < 3; corner++) {
      const v = indices[t * 3 + corner]! * 3;
      for (let axis = 0; axis < 3; axis++)
        sums[v + axis]! += faces[t * 3 + axis]!;
    }
  }
  const unit = (
    x: number,
    y: number,
    z: number,
    out: Float32Array,
    at: number,
  ) => {
    const length = Math.hypot(x, y, z) || 1;
    out[at] = x / length;
    out[at + 1] = y / length;
    out[at + 2] = z / length;
  };
  const rest = new Float32Array(positions.length);
  for (let v = 0; v < vertices; v++)
    unit(sums[v * 3]!, sums[v * 3 + 1]!, sums[v * 3 + 2]!, rest, v * 3);
  // The triangles at each vertex.
  const starts = new Uint32Array(vertices + 1);
  for (const v of indices) starts[v + 1]!++;
  for (let v = 0; v < vertices; v++) starts[v + 1]! += starts[v]!;
  const around = new Uint32Array(indices.length);
  const filled = starts.slice(0, vertices);
  indices.forEach((v, k) => (around[filled[v]!++] = Math.floor(k / 3)));

  const posed = new Float32Array(positions);
  const seenTriangle = new Int32Array(triangles).fill(-1);
  const seenVertex = new Int32Array(vertices).fill(-1);
  const change = new Float64Array(positions.length);
  const moved = new Float32Array(3);
  return morphs.map(({ indices: at, moves }, m) => {
    const turn = new Float32Array(positions.length);
    at.forEach((v, k) => {
      for (let axis = 0; axis < 3; axis++)
        posed[v * 3 + axis] = positions[v * 3 + axis]! + moves[k * 3 + axis]!;
    });
    const touched: number[] = [];
    for (const v of at)
      for (let k = starts[v]!; k < starts[v + 1]!; k++) {
        const t = around[k]!;
        if (seenTriangle[t] === m) continue;
        seenTriangle[t] = m;
        face(posed, t, moved);
        for (let corner = 0; corner < 3; corner++) {
          const u = indices[t * 3 + corner]!;
          if (seenVertex[u] !== m) {
            seenVertex[u] = m;
            touched.push(u);
            change.fill(0, u * 3, u * 3 + 3);
          }
          for (let axis = 0; axis < 3; axis++)
            change[u * 3 + axis]! += moved[axis]! - faces[t * 3 + axis]!;
        }
      }
    for (const u of touched) {
      const i = u * 3;
      unit(
        sums[i]! + change[i]!,
        sums[i + 1]! + change[i + 1]!,
        sums[i + 2]! + change[i + 2]!,
        turn,
        i,
      );
      for (let axis = 0; axis < 3; axis++) turn[i + axis]! -= rest[i + axis]!;
    }
    for (const v of at) posed.set(positions.subarray(v * 3, v * 3 + 3), v * 3);
    return turn;
  });
}
