// How the tortilla flies for Texas Tech (TexasTechProps.tsx), in the head's
// own units, the head at the middle: one, now and then, thrown in from off
// the screen's left at the side of the head. It splats onto it by the ear,
// drapes round it (tortillaDrape.ts), slides slowly down and peels off as it
// falls.

// A tortilla's radius: an 8-inch flour tortilla (20 cm across) at the
// head's own scale, its head about 84 units across, some 15 cm: wider than
// the face, as a real one is.
export const TORTILLA_RADIUS = 56;
// How far to the side it is thrown from: off the screen at any window.
export const OFF_SCREEN = 480;
// It lands on the side of the head on HIT_SIDE (-1, the side on the
// screen's left): its middle HIT.middle along the head (z: by the ear) and
// HIT.up high, lying HIT.out from the middle of the head before it drapes.
// Its loop is HIT_SECONDS long, so it hits now and then, first about
// HIT_FIRST seconds into the chapter; and in its loop, 0 to 1, it sets off,
// lands, has splatted onto the head, lets go and is gone below.
export const HIT_SIDE = -1;
export const HIT = { middle: -16, up: 10, out: 52 };
export const HIT_SECONDS = 8;
const HIT_FIRST = 3;
const SETS_OFF = 0.05;
export const LANDS = 0.28;
const SPLATTED = 0.31;
export const LETS_GO = 0.62;
const GONE = 0.82;
// Where in its loop it is as the chapter starts.
export const HIT_PHASE = (((LANDS - HIT_FIRST / HIT_SECONDS) % 1) + 1) % 1;
// Its throw: how high it starts, how high it arcs, and, thrown like a disc,
// how fast it spins, how it leans toward you and how much it wobbles.
export const FLIGHT = { base: -10, arc: 20, spin: 7, lean: 0.7, wobble: 0.15 };

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

// Where the tortilla is at `u` (0 to 1) through its loop.
export function tortillaAt(u: number): Where {
  // Waiting off the screen, then thrown in from the side, rising to the
  // cheek.
  if (u < LANDS) {
    const v = Math.max(0, (u - SETS_OFF) / (LANDS - SETS_OFF));
    const y =
      FLIGHT.base + (HIT.up - FLIGHT.base) * v + FLIGHT.arc * 4 * v * (1 - v);
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
