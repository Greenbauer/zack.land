// Small maths the scene's modules share.

// `value` held between `low` and `high`.
export const clamp = (value: number, low: number, high: number) =>
  Math.min(Math.max(value, low), high);

// GLSL's smoothstep, in its argument order: 0 at `low` or before, 1 at
// `high` or after, easing in and out between.
export function smoothstep(low: number, high: number, x: number) {
  const t = clamp((x - low) / (high - low), 0, 1);
  return t * t * (3 - 2 * t);
}

// A test for a frame loop that is true on every `n`th call (the `n`th, the
// `2n`th and so on), for work done every few frames rather than each.
export function everyFrames(n: number) {
  let frame = 0;
  return () => {
    frame = (frame + 1) % n;
    return frame === 0;
  };
}
