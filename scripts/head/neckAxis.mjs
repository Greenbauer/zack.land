// The neck's axis and the turn about the top of the spine, as the build's
// neck shapes and weights measure them. Distances in head.bin units.

import { SKULL_PIVOT } from '../../components/Background/neckRig.ts';

// The neck's axis in depth at height y: the middle of its front and back,
// measured on the built mesh at -72 and -120.
export const axisZ = (y) => -25 + (y + 72) * 0.43;
// Where a point sits round the axis (radians, 0 at the front, positive
// toward its own left).
export const around = ([x, y, z]) => Math.atan2(x, z - axisZ(y));
// The direction straight out from the axis, level.
export const radial = ([x, y, z]) => {
  const r = Math.hypot(x, z - axisZ(y)) || 1;
  return [x / r, 0, (z - axisZ(y)) / r];
};

// p turned by `angle` toward +x about the vertical through the top of the
// spine (neckRig.ts SKULL_PIVOT), as the page's shader turns it.
const PIVOT_Z = SKULL_PIVOT[2];
export const twisted = ([x, y, z], angle) => [
  x * Math.cos(angle) + (z - PIVOT_Z) * Math.sin(angle),
  y,
  -x * Math.sin(angle) + (z - PIVOT_Z) * Math.cos(angle) + PIVOT_Z,
];
