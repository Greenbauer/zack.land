import { ExtrudeGeometry, Shape } from 'three';

// A Z for the snores floating up from the sleeping head (StoryProps.tsx):
// a chunky Z `size` tall, a little thick, its middle at its origin.
export function snoreZ(size: number): ExtrudeGeometry {
  const s = size;
  const w = s * 0.8;
  const bar = s * 0.22;
  const z = new Shape();
  z.moveTo(-w / 2, s / 2);
  z.lineTo(w / 2, s / 2);
  z.lineTo(w / 2, s / 2 - bar);
  z.lineTo(-w / 2 + bar * 1.6, -s / 2 + bar);
  z.lineTo(w / 2, -s / 2 + bar);
  z.lineTo(w / 2, -s / 2);
  z.lineTo(-w / 2, -s / 2);
  z.lineTo(-w / 2, -s / 2 + bar);
  z.lineTo(w / 2 - bar * 1.6, s / 2 - bar);
  z.lineTo(-w / 2, s / 2 - bar);
  z.closePath();
  const geometry = new ExtrudeGeometry(z, {
    depth: s * 0.12,
    bevelEnabled: true,
    bevelThickness: s * 0.04,
    bevelSize: s * 0.03,
    bevelSegments: 3,
  });
  geometry.center();
  return geometry;
}
