import { glide } from './headPlace';

// How the head looks around on its own (MyHead.tsx: after its greeting on a
// still page, and from the start on a touch screen), modelled on how people
// glance about rather than drifting between random points: it holds each
// look for a while (a fixation), never quite still, then shifts to the next
// on a damped spring, setting off gently and settling without overshoot.
// Most shifts are small, a few are big; it looks mostly side to side, and
// now and then glances back toward the camera. Every look stays inside the
// head's turning range, so it never runs into its limits.

// A look, in radians: x tips the head (up is negative), y turns it.
export type Gaze = { x: number; y: number };

// The head's turning range (MyHead.tsx clamps any look to it).
export const TIP = [-0.15, 0.13] as const;
export const TURN = [-0.5, 0.3] as const;
// Looks keep this share of the range in from its ends.
const MARGIN = 0.04;

// How long a look is held once the head has arrived, in seconds.
export const HOLD = [2.5, 7] as const;
// How big a shift is, in radians: SMALL plus up to BIG more, smaller more
// often (the random number to the 1.5): typically about 20 degrees, now and
// then across the whole turning range.
const SMALL = 0.18;
const BIG = 0.5;
// How flat shifts are: a shift's tip is at most this share of its size.
const TIP_SHARE = 0.5;
// How often, of all shifts, the head glances back to near the camera.
export const BACK_CHANCE = 0.15;
// How long a shift takes to settle, in seconds: QUICK for the smallest, up
// to QUICK + SLOW for the biggest. Unhurried: about one look every seven or
// eight seconds on average, hold and shift together.
const QUICK = 0.9;
const SLOW = 1.5;
// The faint drift while holding a look: its size in radians and its pace in
// cycles a second (two slow waves on each axis, so it never repeats).
const DRIFT = 0.006;

export type Wander = {
  // Where it looks now, how fast that is changing (radians a second), and
  // where it is shifting to.
  gaze: Gaze;
  speed: Gaze;
  target: Gaze;
  // How long this shift takes to settle (glide's seconds), and when, on the
  // clock, it picks the next look.
  settle: number;
  next: number;
};

const clamp = (v: number, [low, high]: readonly [number, number]) => {
  const inset = (high - low) * MARGIN;
  return Math.min(Math.max(v, low + inset), high - inset);
};

// The next look from `from`, using `random` (0 to 1, as Math.random), and
// how long the shift there takes.
export function nextLook(
  from: Gaze,
  random: () => number,
): { target: Gaze; settle: number } {
  let target: Gaze;
  if (random() < BACK_CHANCE) {
    // Back toward the camera, not quite onto it.
    target = {
      x: (random() - 0.5) * 0.06,
      y: (random() - 0.5) * 0.12,
    };
  } else {
    const size = SMALL + BIG * random() ** 1.5;
    const angle = random() * 2 * Math.PI;
    target = {
      x: from.x + Math.sin(angle) * size * TIP_SHARE,
      y: from.y + Math.cos(angle) * size,
    };
  }
  target = { x: clamp(target.x, TIP), y: clamp(target.y, TURN) };
  const distance = Math.hypot(target.x - from.x, target.y - from.y);
  return {
    target,
    settle: QUICK + SLOW * Math.min(distance / (SMALL + BIG), 1),
  };
}

// A wander starting from where the head looks now (`from`) at `time`,
// holding that look a moment before its first shift.
export function startWander(
  from: Gaze,
  time: number,
  random: () => number = Math.random,
): Wander {
  return {
    gaze: { ...from },
    speed: { x: 0, y: 0 },
    target: { ...from },
    settle: QUICK,
    next: time + 0.3 + random() * 0.7,
  };
}

// The wander `seconds` later, at clock `time`: on to the next look when it
// is due, the gaze gliding toward the current one.
export function stepWander(
  wander: Wander,
  time: number,
  seconds: number,
  random: () => number = Math.random,
): Wander {
  let { target, settle, next } = wander;
  if (time >= next) {
    ({ target, settle } = nextLook(wander.target, random));
    // The shift takes about twice its settling time; then the look is held.
    next = time + 2 * settle + HOLD[0] + random() * (HOLD[1] - HOLD[0]);
  }
  const x = glide(
    { x: wander.gaze.x, speed: wander.speed.x },
    target.x,
    seconds,
    settle,
  );
  const y = glide(
    { x: wander.gaze.y, speed: wander.speed.y },
    target.y,
    seconds,
    settle,
  );
  return {
    gaze: { x: x.x, y: y.x },
    speed: { x: x.speed, y: y.speed },
    target,
    settle,
    next,
  };
}

// The gaze as shown at `time`: with the faint drift added.
export const shownGaze = ({ gaze }: Wander, time: number): Gaze => ({
  x: gaze.x + DRIFT * 0.5 * (Math.sin(time * 1.3) + Math.sin(time * 0.71)),
  y: gaze.y + DRIFT * 0.5 * (Math.sin(time * 0.9 + 1) + Math.sin(time * 0.43)),
});
