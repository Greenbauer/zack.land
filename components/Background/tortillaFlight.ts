// How the tortillas fly for Texas Tech (TexasTechProps.tsx), in the head's
// own units, the head at the middle.

// How many tortillas fly.
export const TORTILLAS = 10;
// A tortilla's radius: an 8-inch flour tortilla (20 cm across) at the
// head's own scale, its head about 84 units across, some 15 cm: wider than
// the face, as a real one is.
export const TORTILLA_RADIUS = 56;

// Each tortilla's flight: which way it crosses, how deep in the scene, how
// high, how long a crossing takes and where in it it starts. Every one is
// thrown from off one side of the screen clear across to off the other, on
// one shallow arc behind the head (a loop that starts or ends on screen pops
// in or out of thin air), and HITS of them are aimed at the face instead: each flies into
// it, splats and drapes over it (tortillaDrape.ts), slides slowly down and
// peels off as it falls.
export const HITS = 2;
// How far either side of the head a crossing starts and ends: off the
// screen at any window (the head's units).
export const OFF_SCREEN = 480;
export const FLIGHTS = Array.from({ length: TORTILLAS }, (_, k) => {
  const pick = (n: number) => ((k * 7919 + n * 104729) % 1000) / 1000;
  return {
    way: k % 2 ? 1 : -1,
    hits: k < HITS,
    // Behind the head, clear of it at its size; at a real tortilla's size
    // one crossing in front of the face filled the screen. One thrown at
    // the face comes in from just in front of it.
    depth: k < HITS ? 95 : -175 + pick(1) * 45,
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

// Where a tortilla aimed at the face lands: its middle on the middle of
// the face (the head's units), and when in its loop, 0 to 1, it lands, has
// splatted flat onto the face, lets go and is gone below.
export const FACE = { y: 8, z: 62 };
export const LANDS = 0.4;
const SPLATTED = 0.43;
export const LETS_GO = 0.72;
const GONE = 0.92;
// How far it slides down the face while it clings, and how far it drops
// once it lets go.
const SLIDE = 26;
const DROP = 320;

const ease = (t: number) => {
  const c = Math.min(1, Math.max(0, t));
  return c * c * (3 - 2 * c);
};

// Where a tortilla's middle is at `u` (0 to 1) through its loop, and how
// draped over the face it is then (`drape`: 0 flying flat, 1 lying wholly on
// the face).
export function tortillaAt(
  flight: (typeof FLIGHTS)[number],
  u: number,
): { x: number; y: number; z: number; drape: number } {
  if (!flight.hits) {
    const x = flight.way * (-OFF_SCREEN + 2 * OFF_SCREEN * u);
    return {
      x,
      y: flight.base + flight.arc * 4 * u * (1 - u),
      z: flight.depth,
      drape: 0,
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
      drape: 0,
    };
  }
  // Splatted onto the face, it slides slowly down it, faster as it goes.
  const cling = Math.min(1, (u - LANDS) / (LETS_GO - LANDS));
  const y = FACE.y - SLIDE * cling * cling;
  if (u < LETS_GO)
    return {
      x: 0,
      y,
      z: FACE.z,
      drape: ease((u - LANDS) / (SPLATTED - LANDS)),
    };
  // Peeling off: it drops away, coming loose of the face as it goes.
  const fall = Math.min(1, (u - LETS_GO) / (GONE - LETS_GO));
  return {
    x: 0,
    y: y - DROP * fall * fall,
    z: FACE.z + 20 * fall,
    drape: 1 - ease(fall * 1.6),
  };
}
