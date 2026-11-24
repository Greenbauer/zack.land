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
// in or out of thin air), and one, now and then, is aimed at the side of the
// head instead: it flies in from off the screen's left, splats onto the
// cheek and drapes round it (tortillaDrape.ts), slides slowly down and peels
// off as it falls.
export const HITS = 1;
// How far either side of the head a crossing starts and ends: off the
// screen at any window (the head's units).
export const OFF_SCREEN = 480;
// The tortilla thrown at the head lands on the side of it on HIT_SIDE (-1,
// the side on the screen's left), on the cheek: its middle HIT.middle along
// the head (z: by the ear) and HIT.up high, lying HIT.out from the middle of the head
// before it drapes. Its loop is HIT_SECONDS long, so it hits now and then,
// first about HIT_FIRST seconds into the chapter; and in its loop, 0 to 1, it
// sets off, lands, has splatted onto the cheek, lets go and is gone below.
export const HIT_SIDE = -1;
export const HIT = { middle: -16, up: 10, out: 52 };
export const HIT_SECONDS = 8;
const HIT_FIRST = 3;
const SETS_OFF = 0.05;
export const LANDS = 0.28;
const SPLATTED = 0.31;
export const LETS_GO = 0.62;
const GONE = 0.82;
const HIT_PHASE = (((LANDS - HIT_FIRST / HIT_SECONDS) % 1) + 1) % 1;
export const FLIGHTS = Array.from({ length: TORTILLAS }, (_, k) => {
  const pick = (n: number) => ((k * 7919 + n * 104729) % 1000) / 1000;
  return {
    way: k % 2 ? 1 : -1,
    hits: k < HITS,
    // Behind the head, clear of it at its size; at a real tortilla's size
    // one crossing in front of the face filled the screen. One thrown at
    // the face comes in from just in front of it.
    depth: -175 + pick(1) * 45,
    base: -30 + pick(2) * 70,
    arc: 12 + pick(3) * 22,
    seconds: k < HITS ? HIT_SECONDS : 3.4 + pick(4) * 1.8,
    phase: k < HITS ? HIT_PHASE : pick(5),
    // Thrown like a disc: how fast it spins, how it leans toward you, and
    // how much it wobbles.
    spin: (k % 2 ? 1 : -1) * (5 + pick(6) * 4),
    lean: 0.45 + pick(7) * 0.5,
    wobble: 0.1 + pick(8) * 0.15,
  };
});

// How far it slides down the cheek while it clings, and how far it drops
// once it lets go.
const SLIDE = 22;
const DROP = 320;

const ease = (t: number) => {
  const c = Math.min(1, Math.max(0, t));
  return c * c * (3 - 2 * c);
};

export type Where = {
  x: number;
  y: number;
  z: number;
  // How draped over the head it is: 0 flying flat, 1 lying wholly on it.
  drape: number;
  // Where its middle is on the side of the head, up it, while it drapes.
  up: number;
};

// Where a thrown tortilla is at `u` (0 to 1) through its loop.
export function tortillaAt(flight: (typeof FLIGHTS)[number], u: number): Where {
  if (!flight.hits) {
    const x = flight.way * (-OFF_SCREEN + 2 * OFF_SCREEN * u);
    return {
      x,
      y: flight.base + flight.arc * 4 * u * (1 - u),
      z: flight.depth,
      drape: 0,
      up: 0,
    };
  }
  // Waiting off the screen, then thrown in from the side, rising to the
  // cheek.
  if (u < LANDS) {
    const v = Math.max(0, (u - SETS_OFF) / (LANDS - SETS_OFF));
    const y =
      flight.base + (HIT.up - flight.base) * v + flight.arc * 4 * v * (1 - v);
    return {
      x: HIT_SIDE * (HIT.out + (OFF_SCREEN - HIT.out) * (1 - v)),
      y,
      z: HIT.middle,
      drape: 0,
      up: y,
    };
  }
  // Splatted onto the cheek, it slides slowly down, faster as it goes.
  const cling = Math.min(1, (u - LANDS) / (LETS_GO - LANDS));
  const up = HIT.up - SLIDE * cling * cling;
  if (u < LETS_GO)
    return {
      x: HIT_SIDE * HIT.out,
      y: up,
      z: HIT.middle,
      drape: ease((u - LANDS) / (SPLATTED - LANDS)),
      up,
    };
  // Peeling off: it drops away, coming loose as it goes, and is gone.
  const fall = Math.min(1, (u - LETS_GO) / (GONE - LETS_GO));
  const y = up - DROP * fall * fall;
  return {
    x: HIT_SIDE * (HIT.out + 20 * fall),
    y,
    z: HIT.middle,
    drape: 1 - ease(fall * 1.6),
    up: y,
  };
}
