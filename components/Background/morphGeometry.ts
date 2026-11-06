import { BufferAttribute, BufferGeometry } from 'three';

import type { HeadMesh } from './headGeometry';

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
    const normalsOf = (positions: Float32Array) => {
      const shape = new BufferGeometry();
      shape.setAttribute('position', new BufferAttribute(positions, 3));
      shape.setIndex(new BufferAttribute(part.indices, 1));
      shape.computeVertexNormals();
      return shape.getAttribute('normal').array as Float32Array;
    };
    const rest = normalsOf(part.positions);
    const moves = part.morphs.map(({ indices, moves: sparse }) => {
      const dense = new Float32Array(part.positions.length);
      indices.forEach((v, k) =>
        dense.set(sparse.subarray(k * 3, k * 3 + 3), v * 3),
      );
      return dense;
    });
    geometry.morphAttributes.position = moves.map(
      (dense) => new BufferAttribute(dense, 3),
    );
    geometry.morphAttributes.normal = moves.map((dense) => {
      const posed = normalsOf(part.positions.map((c, i) => c + dense[i]!));
      return new BufferAttribute(
        posed.map((c, i) => c - rest[i]!),
        3,
      );
    });
    geometry.morphTargetsRelative = true;
  }
  return geometry;
}
