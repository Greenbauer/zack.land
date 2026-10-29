// How much each skin vertex follows the head when it turns, 0 to 1: the head
// fully, the neck less and less toward its base, the shoulders and chest not
// at all. The page turns each vertex by its weight times the head's turn
// (components/Background/headTurn.ts), so the neck twists and bends smoothly
// between a turning head and still shoulders.

import { smooth } from './mesh.mjs';

const smoothstep = (x, low, high) => {
  const t = Math.min(Math.max((x - low) / (high - low), 0), 1);
  return t * t * (3 - 2 * t);
};

// Heights over the seam (`height`, head.bin units) over which the weight goes
// from 0 at the base of the neck to 1. It reaches 1 well below the seam, so
// after the evening out below the whole skull still turns as one piece.
const ALONG = [-60, -18];
// Below the seam, only the neck turns: the weight falls away over these
// distances from the neck's axis, so the trapezius and shoulders stay put.
const OUT = [36, 52];
// From these heights over the seam up, the turn no longer falls away from the
// neck's axis: the jaw and chin, which reach far from it, turn with the head.
const HEAD = [-24, -8];
// The weights are then evened out over the surface, so no edge carries a jump
// that would crease when the head turns.
const PASSES = 40;

// The neck's axis: the middle of its front and back, measured on the built
// mesh at -72 and -120.
const axisZ = (y) => -25 + (y + 72) * 0.43;

export function headWeights({ vertices, faces }, height) {
  const weights = vertices.map(([x, y, z]) => {
    const h = height([x, y, z]);
    const radius = Math.hypot(x, z - axisZ(y));
    const neck = 1 - smoothstep(radius, ...OUT);
    const head = smoothstep(h, ...HEAD);
    return smoothstep(h, ...ALONG) * (neck + (1 - neck) * head);
  });
  // Smoothing moves points, so the weights ride as each point's x and are
  // read back from it.
  const all = new Map(vertices.map((_, i) => [i, 1]));
  const evened = smooth(
    { vertices: weights.map((w) => [w, 0, 0]), faces },
    all,
    PASSES,
    false,
  );
  return evened.vertices.map(([w]) => Math.min(Math.max(w, 0), 1));
}
