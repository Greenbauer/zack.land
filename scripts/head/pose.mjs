// MakeHuman's base mesh stands with its arms out at its sides; this lowers
// them to hang down, using MakeHuman's own skeleton and skin weights (CC0,
// data/rigs/default.mhskel and default_weights.mhw): each arm's bones swing
// down `degrees` about the shoulder joint (the head of upperarm01), and each
// vertex moves by its weights' share of that swing, so the shoulder bends
// smoothly into the arm.

import { edgeNeighbours } from './mesh.mjs';

// Measured on the base mesh the upper arm hangs 50 degrees below level, 40
// off vertical. Lowered these 22 degrees it hangs just clear of the lats, as
// in the back photo; further, the back of the armpit crushed between the arm
// and the side and folded over.
export const ARMS = { degrees: 22, passes: 20 };

const centre = (vertices, ids) =>
  [0, 1, 2].map(
    (a) => ids.reduce((sum, i) => sum + vertices[i][a], 0) / ids.length,
  );

// The point p turned by `angle` about the forward (z) axis through `about`.
const turn = (p, about, angle) => {
  const [x, y] = [p[0] - about[0], p[1] - about[1]];
  return [
    about[0] + x * Math.cos(angle) - y * Math.sin(angle),
    about[1] + x * Math.sin(angle) + y * Math.cos(angle),
    p[2],
  ];
};

// `vertices` (MakeHuman's own, in its units, with its `faces`) moved in
// place.
export function hangArms(vertices, faces, skeleton, skinWeights) {
  const { bones, joints } = skeleton;
  const blend = [];
  const below = (bone, root) =>
    bone === root || (bones[bone].parent && below(bones[bone].parent, root));
  for (const [side, sign] of [
    ['L', -1],
    ['R', 1],
  ]) {
    const joint = centre(vertices, joints[bones[`upperarm01.${side}`].head]);
    const angle = (sign * ARMS.degrees * Math.PI) / 180;
    const share = new Map();
    for (const [bone, list] of Object.entries(skinWeights))
      if (below(bone, `upperarm01.${side}`))
        for (const [i, w] of list) share.set(i, (share.get(i) ?? 0) + w);
    for (const [i, s] of share)
      vertices[i] = turn(vertices[i], joint, angle * s);
    blend.push(...share);
  }
  relax(vertices, faces, new Map(blend.map(([i, s]) => [i, 4 * s * (1 - s)])));
}

// Where the arm's share falls from 1 to 0, round the armpit, the swing
// crushes the skin between the arm and the side and folded it over: that
// band, weighted most where the share is a half, is evened out
// (ARMS.passes times, keeping its size).
function relax(vertices, faces, weights) {
  const near = edgeNeighbours({ vertices, faces });
  for (let pass = 0; pass < ARMS.passes; pass++)
    for (const factor of [0.5, -0.53]) {
      const next = new Map();
      for (const [i, w] of weights) {
        if (!near[i].size) continue;
        const mean = [0, 1, 2].map(
          (a) =>
            [...near[i]].reduce((sum, j) => sum + vertices[j][a], 0) /
            near[i].size,
        );
        next.set(
          i,
          vertices[i].map((c, a) => c + factor * w * (mean[a] - c)),
        );
      }
      for (const [i, v] of next) vertices[i] = v;
    }
}
