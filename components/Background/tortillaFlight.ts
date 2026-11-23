// How the tortillas fly for Texas Tech (TexasTechProps.tsx), in the head's
// own units, the head at the middle.

// How many tortillas fly.
export const TORTILLAS = 10;

// Each tortilla's flight: which way it crosses, how deep in the scene, how
// high, how long a crossing takes and where in it it starts. Every one is
// thrown from off one side of the screen clear across to off the other, on
// one shallow arc (a loop that starts or ends on screen pops in or out of
// thin air), and HITS of them are aimed at the face instead: each flies into
// it, sticks flat for a moment and slides off.
export const HITS = 2;
// How far either side of the head a crossing starts and ends: off the
// screen at any window (the head's units).
export const OFF_SCREEN = 480;
export const FLIGHTS = Array.from({ length: TORTILLAS }, (_, k) => {
  const pick = (n: number) => ((k * 7919 + n * 104729) % 1000) / 1000;
  return {
    way: k % 2 ? 1 : -1,
    hits: k < HITS,
    // In front of the face, clear of the nose, or behind the head.
    depth: k % 3 ? 80 + pick(1) * 35 : -120 + pick(1) * 40,
    base: -30 + pick(2) * 70,
    arc: 12 + pick(3) * 22,
    seconds: 3.4 + pick(4) * 1.8,
    phase: pick(5),
    // Thrown like a disc: how fast it spins, how it leans toward you, and
    // how much it wobbles.
    spin: (k % 2 ? 1 : -1) * (5 + pick(6) * 4),
    lean: 0.45 + pick(7) * 0.5,
    wobble: 0.1 + pick(8) * 0.15,
  };
});

// Where a tortilla aimed at the face lands: the middle of the face, just in
// front of it (the head's units), and when in its loop, 0 to 1, it lands,
// lets go and is gone below.
export const FACE = { y: 8, z: 62 };
export const LANDS = 0.45;
export const LETS_GO = 0.62;
const GONE = 0.9;

// Where a tortilla is at `u` (0 to 1) through its loop, and whether it is
// stuck to the face then (lying flat on it).
export function tortillaAt(
  flight: (typeof FLIGHTS)[number],
  u: number,
): { x: number; y: number; z: number; stuck: boolean } {
  if (!flight.hits) {
    const x = flight.way * (-OFF_SCREEN + 2 * OFF_SCREEN * u);
    return {
      x,
      y: flight.base + flight.arc * 4 * u * (1 - u),
      z: flight.depth,
      stuck: false,
    };
  }
  if (u < LANDS) {
    // In from off one side to the face, rising to it.
    const v = u / LANDS;
    return {
      x: -flight.way * OFF_SCREEN * (1 - v),
      y:
        flight.base + (FACE.y - flight.base) * v + flight.arc * 4 * v * (1 - v),
      z: flight.depth + (FACE.z - flight.depth) * v,
      stuck: false,
    };
  }
  if (u < LETS_GO) return { x: 0, ...FACE, stuck: true };
  // Sliding down off the face, faster as it goes, and away below.
  const fall = Math.min(1, (u - LETS_GO) / (GONE - LETS_GO));
  return {
    x: 0,
    y: FACE.y - 300 * fall * fall,
    z: FACE.z + 6 * fall,
    stuck: true,
  };
}
