import { glide } from './headPlace';
import { Side, SIDES } from './sideMorphs';

// Little things the head does on its own, whatever else it is doing and on
// their own clock, so it never looks posed: it tilts slightly to one side or
// the other now and then (a roll of the head on its neck: headTurn.ts), and
// every few seconds a passing look comes and goes: one brow raised, the other
// following a beat later and less, as its eye squints a little; both brows up,
// one leading; one eye narrowed; the lips pursed a little; a faint half smile
// (the one-sided ones made by sideMorphs.ts). Brow looks come most often.
// The mouth only moves subtly: it never opens on its own. No wide eyes: opening the lids round the still eyeballs
// reads as the eyes popping out.
// MyHead.tsx lays these over its other movements and expressions; the
// greeting and a tap's reaction keep the face to themselves.

// The tilt: at most TILT_MAX radians either way (about 7 degrees), held for
// TILT_HOLD seconds and then back to level for LEVEL_HOLD before the next,
// so it tilts once at a time, never from one tilt into another, and seldom:
// when a level spell ends it tilts only TILT_CHANCE of the time, otherwise
// staying level another spell. It moves in and out over TILT_SETTLE. It tilts only while the head looks up or down (tiltRoom),
// not straight ahead nor merely to one side: there any tilt it has comes
// back to level quickly, over TILT_RETURN seconds, and is dropped.
export const TILT_MAX = 0.12;
const TILT_HOLD = [3, 7] as const;
const LEVEL_HOLD = [8, 18] as const;
export const TILT_CHANCE = 0.5;
const TILT_SETTLE = [0.5, 0.8] as const;
export const TILT_RETURN = 0.5;

// The passing looks: each the expressions (head.bin's morph targets, and the
// one-sided ones) it is made of, with the range each reaches at its height,
// for one side of the face (`side`) and the other (`other`).
type Range = readonly [number, number];
// A morph's range, and optionally how late it starts (a share of the look's
// time), so the brows move as a wave: one leads, the other follows.
type Part = Range | readonly [number, number, number];
export const LOOKS: Record<
  string,
  (_side: Side, _other: Side) => Record<string, Part>
> = {
  // One brow up, the other following a beat later and less, its eye
  // squinting a little.
  oneBrow: (side, other) => ({
    [`browsUp${side}`]: [0.55, 0.85],
    [`browsUp${other}`]: [0.15, 0.3, 0.15],
    [`squint${other}`]: [0.1, 0.25],
  }),
  // Both brows up, one leading the other.
  browsUp: (side, other) => ({
    [`browsUp${side}`]: [0.35, 0.6],
    [`browsUp${other}`]: [0.3, 0.5, 0.12],
  }),
  oneEye: (side) => ({ [`squint${side}`]: [0.4, 0.7], pout: [0.1, 0.2] }),
  purse: () => ({ pout: [0.2, 0.4] }),
  halfSmile: (side) => ({ smile: [0.2, 0.35], [`squint${side}`]: [0.1, 0.2] }),
};
// How often each look comes up against the others: the brows most.
export const LOOK_WEIGHTS: Record<string, number> = {
  oneBrow: 2,
  browsUp: 2,
  oneEye: 1,
  purse: 1,
  halfSmile: 1,
};
// How long one lasts, and the gap before the next, in seconds. A look that
// moves the brows (QUICK_LOOKS) is a quick flick instead: up and back down
// within QUICK_LASTS.
const FACE_LASTS = [1.2, 2.8] as const;
const FACE_GAP = [2.5, 7] as const;
export const QUICK_LOOKS = new Set(['oneBrow', 'browsUp']);
export const QUICK_LASTS = [0.7, 1.2] as const;

export type Ambient = {
  tilt: number;
  tiltSpeed: number;
  tiltTarget: number;
  tiltSettle: number;
  nextTilt: number;
  face: {
    name: string;
    peaks: Record<string, number>;
    // How late each morph starts, as a share of the look's time.
    lags: Record<string, number>;
    start: number;
    end: number;
  } | null;
  nextFace: number;
};

const between = ([low, high]: readonly [number, number], r: number) =>
  low + (high - low) * r;

const ramp = (v: number, low: number, high: number) => {
  const t = Math.min(Math.max((v - low) / (high - low), 0), 1);
  return t * t * (3 - 2 * t);
};

// How much of its tilt the head takes looking `look` (radians: x tips it,
// down positive; y turns it, which does not count): 0 looking level, to 1
// looking clearly up or down, toward a corner included.
export const tiltRoom = ({ x }: { x: number; y: number }) =>
  ramp(Math.abs(x), 0.04, 0.1);

export const startAmbient = (
  time: number,
  random: () => number = Math.random,
): Ambient => ({
  tilt: 0,
  tiltSpeed: 0,
  tiltTarget: 0,
  tiltSettle: TILT_SETTLE[0],
  nextTilt: time + between(TILT_HOLD, random()) / 2,
  face: null,
  nextFace: time + between(FACE_GAP, random()) / 2,
});

// Tilted, it goes back to level; level, it tilts, to either side.
function nextTilt(ambient: Ambient, time: number, random: () => number) {
  if (time < ambient.nextTilt) return ambient;
  if (ambient.tiltTarget !== 0)
    return {
      ...ambient,
      tiltTarget: 0,
      tiltSettle: between(TILT_SETTLE, random()),
      nextTilt: time + between(LEVEL_HOLD, random()),
    };
  if (random() >= TILT_CHANCE)
    return { ...ambient, nextTilt: time + between(LEVEL_HOLD, random()) };
  const side = random() < 0.5 ? -1 : 1;
  return {
    ...ambient,
    tiltTarget: side * TILT_MAX * between([0.4, 1], random()),
    tiltSettle: between(TILT_SETTLE, random()),
    nextTilt: time + between(TILT_HOLD, random()),
  };
}

function nextFace(ambient: Ambient, time: number, random: () => number) {
  if (ambient.face && time >= ambient.face.end)
    return {
      ...ambient,
      face: null,
      nextFace: time + between(FACE_GAP, random()),
    };
  if (ambient.face || time < ambient.nextFace) return ambient;
  const names = Object.keys(LOOKS);
  let pick = random() * names.reduce((sum, n) => sum + LOOK_WEIGHTS[n]!, 0);
  const name = names.find((n) => (pick -= LOOK_WEIGHTS[n]!) < 0) ?? names[0]!;
  const side = SIDES[Math.floor(random() * 2)]!;
  const other = side === 'Left' ? 'Right' : 'Left';
  const parts = Object.entries(LOOKS[name]!(side, other));
  const peaks = Object.fromEntries(
    parts.map(([morph, [low, high]]) => [
      morph,
      between([low, high], random()),
    ]),
  );
  const lags = Object.fromEntries(
    parts.map(([morph, part]) => [morph, part[2] ?? 0]),
  );
  return {
    ...ambient,
    face: {
      name,
      peaks,
      lags,
      start: time,
      end:
        time +
        between(QUICK_LOOKS.has(name) ? QUICK_LASTS : FACE_LASTS, random()),
    },
  };
}

// The ambient movements `seconds` later, at clock `time`, the head looking
// `look` (its turn, as tiltRoom takes it).
export function stepAmbient(
  ambient: Ambient,
  look: { x: number; y: number },
  time: number,
  seconds: number,
  random: () => number = Math.random,
): Ambient {
  let next = nextFace(nextTilt(ambient, time, random), time, random);
  const room = tiltRoom(look);
  // No room for a tilt: drop it (it does not come back when the room does),
  // and stay level a while before the next.
  if (room < 0.3 && next.tiltTarget !== 0)
    next = {
      ...next,
      tiltTarget: 0,
      nextTilt: time + between(LEVEL_HOLD, random()),
    };
  const tilt = glide(
    { x: next.tilt, speed: next.tiltSpeed },
    next.tiltTarget * room,
    seconds,
    // Back to level quickly where there is little room for a tilt.
    room < 0.3 ? TILT_RETURN : next.tiltSettle,
  );
  return { ...next, tilt: tilt.x, tiltSpeed: tilt.speed };
}

const smoothstep = (t: number) => {
  const c = Math.min(Math.max(t, 0), 1);
  return c * c * (3 - 2 * c);
};

// The passing look's strengths at `time`: rising over its first third,
// falling over its last half, so it comes and goes rather than switching.
export function ambientFace({ face }: Ambient, time: number) {
  if (!face) return {};
  const t = (time - face.start) / (face.end - face.start);
  // A quick look rises in its first fifth and falls over its last third.
  const [rise, fall] = QUICK_LOOKS.has(face.name) ? [5, 3] : [3, 2];
  return Object.fromEntries(
    Object.entries(face.peaks).map(([morph, peak]) => {
      // A lagging morph runs the same course, starting later.
      const lag = face.lags[morph] ?? 0;
      const own = Math.max(t - lag, 0) / (1 - lag);
      const strength = Math.min(
        smoothstep(own * rise),
        smoothstep((1 - own) * fall),
      );
      return [morph, peak * strength];
    }),
  );
}

// `targets` (the face the head would make) with the passing look laid over
// it, each at most whole.
export function withAmbient(
  targets: Record<string, number>,
  ambient: Ambient,
  time: number,
): Record<string, number> {
  const out = { ...targets };
  for (const [name, strength] of Object.entries(ambientFace(ambient, time)))
    out[name] = Math.min(1, (out[name] ?? 0) + strength);
  return out;
}
