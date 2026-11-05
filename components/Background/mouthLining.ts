import type { WebGLProgramParametersWithUniforms } from 'three';

// How far into the mouth (head.bin units, about 1.7 mm each) the lips'
// own look reaches as they turn in, before the mouth goes dark.
export const LINING = 3;

// Each mouth point's share of the lips' look: 1 on the mouth's open edge (the
// lip edge, where it meets the skin), easing to 0 at `depth` in. Drawn flat
// black right from the edge, the lips showed no thickness, only a blade; this
// way each lip rolls in as a rounded rim, and deeper in the mouth stays black.
export function liningOf(
  positions: ArrayLike<number>,
  indices: ArrayLike<number>,
  depth = LINING,
): Float32Array {
  const uses = new Map<string, number>();
  for (let t = 0; t < indices.length; t += 3)
    for (let k = 0; k < 3; k++) {
      const a = indices[t + k]!;
      const b = indices[t + ((k + 1) % 3)]!;
      const key = a < b ? `${a},${b}` : `${b},${a}`;
      uses.set(key, (uses.get(key) ?? 0) + 1);
    }
  const edge = new Set<number>();
  for (const [key, count] of uses)
    if (count === 1) key.split(',').forEach((i) => edge.add(Number(i)));
  const at = (i: number) => [0, 1, 2].map((a) => positions[i * 3 + a]!);
  const ends = [...edge].map(at);
  const lining = new Float32Array(positions.length / 3);
  lining.forEach((_, i) => {
    const p = at(i);
    const r = Math.min(
      ...ends.map((e) =>
        Math.hypot(p[0]! - e[0]!, p[1]! - e[1]!, p[2]! - e[2]!),
      ),
    );
    const s = Math.min(r / depth, 1);
    const share = 1 - s * s * (3 - 2 * s);
    lining[i] = share * share;
  });
  return lining;
}

// Shades the mouth by its `lining` attribute: the lit colour (the head's own
// glossy look) where it is 1, black where it is 0.
export const lineMouth = (shader: WebGLProgramParametersWithUniforms): void => {
  shader.vertexShader = shader.vertexShader
    .replace(
      '#include <common>',
      '#include <common>\nattribute float lining;\nvarying float vLining;',
    )
    .replace(
      '#include <begin_vertex>',
      '#include <begin_vertex>\nvLining = lining;',
    );
  shader.fragmentShader = shader.fragmentShader
    .replace('#include <common>', '#include <common>\nvarying float vLining;')
    .replace(
      '#include <opaque_fragment>',
      'outgoingLight *= vLining;\n#include <opaque_fragment>',
    );
};
