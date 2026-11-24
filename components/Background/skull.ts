import { BufferGeometry, Float32BufferAttribute, Vector3 } from 'three';

// A geometry carried whole by the skull: every vertex fully the head's, for
// turnHead.
export function onSkull(geometry: BufferGeometry): BufferGeometry {
  const count = geometry.getAttribute('position').count;
  geometry.setAttribute(
    'headWeight',
    new Float32BufferAttribute(new Float32Array(count).fill(1), 1),
  );
  geometry.setAttribute(
    'turnWeight',
    new Float32BufferAttribute(new Float32Array(count).fill(1), 1),
  );
  return geometry;
}

// A geometry's middle (its bounding box's).
export const centre = (geometry: BufferGeometry) => {
  geometry.computeBoundingBox();
  return geometry.boundingBox!.getCenter(new Vector3());
};
