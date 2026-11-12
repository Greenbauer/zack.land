import { smoothstep } from './maths';

// The head blinks on its own clock, in every state (MyHead.tsx lays it over
// whatever else the face is doing), sparsely: every twenty seconds or so at
// irregular gaps, each blink closing fast and opening more slowly, now and
// then twice in a row, and once in a while as the eyes shift quickly to a
// new look (a glance carries a blink with it). Without blinks the face read
// as a still; blinking as often as a person at rest (17 a minute), or even
// every ten seconds, drew the eye to it.

// One blink's course, in seconds: the lids close, stay shut a moment, open.
export const BLINK = { close: 0.08, hold: 0.04, open: 0.18 };
const LENGTH = BLINK.close + BLINK.hold + BLINK.open;
// The gaps between blinks: at least `least` seconds, `mean` on average
// (about 3 a minute), never more than `most`.
export const GAP = { least: 8, mean: 20, most: 40 } as const;
// How often a blink comes twice, the second just after the first.
const DOUBLE_CHANCE = 0.03;
const DOUBLE_AFTER = LENGTH + 0.05;
// A quick shift of the gaze (faster than `speed`, radians a second) brings a
// blink with it `chance` of the time, if the last began over `after` seconds
// before.
export const SHIFT = { speed: 1.5, chance: 0.1, after: 8 } as const;

export type Blink = {
  // When the current (or last) blink began, whether it comes twice, when
  // the next is due, and whether the gaze was shifting at the last step.
  start: number;
  double: boolean;
  next: number;
  shifting: boolean;
};

const gap = (random: () => number) =>
  Math.min(
    GAP.least - (GAP.mean - GAP.least) * Math.log(1 - random()),
    GAP.most,
  );

export const startBlink = (
  time: number,
  random: () => number = Math.random,
): Blink => ({
  start: -Infinity,
  double: false,
  next: time + gap(random),
  shifting: false,
});

const begin = (time: number, random: () => number): Blink => {
  const double = random() < DOUBLE_CHANCE;
  return {
    start: time,
    double,
    next: time + (double ? DOUBLE_AFTER : 0) + LENGTH + gap(random),
    shifting: false,
  };
};

// The blink clock at `time`, the gaze turning at `gazeSpeed` (radians a
// second).
export function stepBlink(
  blink: Blink,
  time: number,
  gazeSpeed: number,
  random: () => number = Math.random,
): Blink {
  const shifting = gazeSpeed > SHIFT.speed;
  // A shift just starting: blink with it, now and then.
  if (
    shifting &&
    !blink.shifting &&
    time - blink.start > SHIFT.after &&
    random() < SHIFT.chance
  )
    return begin(time, random);
  if (time >= blink.next) return begin(time, random);
  return { ...blink, shifting };
}

// How shut one blink's lids are `t` seconds into it, 0 to 1.
const course = (t: number) =>
  t < 0 || t > LENGTH
    ? 0
    : t < BLINK.close
      ? smoothstep(0, 1, t / BLINK.close)
      : t < BLINK.close + BLINK.hold
        ? 1
        : 1 - smoothstep(0, 1, (t - BLINK.close - BLINK.hold) / BLINK.open);

// How shut the lids are at `time` (head.bin's blink), 0 to 1.
export const blinkAmount = ({ start, double }: Blink, time: number) =>
  Math.max(
    course(time - start),
    double ? course(time - start - DOUBLE_AFTER) : 0,
  );
