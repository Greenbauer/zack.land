// For the tests: a stand-in for Math.random that gives the same numbers,
// 0 to 1, every run from the same `seed` (a linear congruential generator).
export const seeded = (seed: number) => () => {
  seed = (seed * 1664525 + 1013904223) % 4294967296;
  return seed / 4294967296;
};
