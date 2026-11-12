// The soft edges every shape and weight in the build fades in or out over.

// 0 at or below `low`, 1 at or above `high`, an S-curve between.
export const smoothstep = (x, low, high) => {
  const t = Math.min(Math.max((x - low) / (high - low), 0), 1);
  return t * t * (3 - 2 * t);
};
// A bell, 1 at d = 0, falling to about a third at d = width.
export const bump = (d, width) => Math.exp(-((d / width) ** 2));
