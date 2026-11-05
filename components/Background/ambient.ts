import {
  BOLD_CHANCE,
  BOLD_LOOKS,
  FACE_LASTS,
  LASTS,
  LOOK_WEIGHTS,
  LOOKS,
  paceOf,
} from './ambientLooks';
import { glide } from './headPlace';
import { SIDES } from './sideMorphs';

// Little things the head does on its own, whatever else it is doing and on
// their own clock, so it never looks posed: it tilts slightly to one side or
// the other now and then (a roll of the head on its neck: headTurn.ts), and
// every few seconds a passing look comes and goes (ambientLooks.ts), setting
// in quickly, holding, and letting go. While it looks around on its own, now
// and then the look is a bold one; following the pointer it keeps to the
// small ones, and a bold look under way when the pointer moves lets go at
// once. Blinks run on their own clock (blink.ts). MyHead.tsx lays these over
// its other movements and expressions; the greeting and a tap's reaction keep
// the face to themselves.

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

// The gap between one look and the next, in seconds.
const FACE_GAP = [2.5, 7] as const;

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

function nextFace(
  ambient: Ambient,
  time: number,
  random: () => number,
  bold: boolean,
) {
  const face = ambient.face;
  // A bold look when the pointer moves: let go of it now.
  const offset = face ? paceOf(face.name).offset : 0;
  if (face && !bold && face.name in BOLD_LOOKS && face.end > time + offset)
    return { ...ambient, face: { ...face, end: time + offset } };
  if (face && time >= face.end)
    return {
      ...ambient,
      face: null,
      nextFace: time + between(FACE_GAP, random()),
    };
  if (ambient.face || time < ambient.nextFace) return ambient;
  const looks = bold && random() < BOLD_CHANCE ? BOLD_LOOKS : LOOKS;
  const names = Object.keys(looks);
  let pick = random() * names.reduce((sum, n) => sum + LOOK_WEIGHTS[n]!, 0);
  const name = names.find((n) => (pick -= LOOK_WEIGHTS[n]!) < 0) ?? names[0]!;
  const side = SIDES[Math.floor(random() * 2)]!;
  const other = side === 'Left' ? 'Right' : 'Left';
  const parts = Object.entries(looks[name]!(side, other));
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
      end: time + between(LASTS[name] ?? FACE_LASTS, random()),
    },
  };
}

// The ambient movements `seconds` later, at clock `time`, the head looking
// `look` (its turn, as tiltRoom takes it); `bold` while it looks around on
// its own.
export function stepAmbient(
  ambient: Ambient,
  look: { x: number; y: number },
  time: number,
  seconds: number,
  random: () => number = Math.random,
  bold = false,
): Ambient {
  let next = nextFace(nextTilt(ambient, time, random), time, random, bold);
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

// A movement's course from 0 to 1 as people make one: setting off gently,
// fastest midway, settling gently (the minimum-jerk curve of reaching
// movements).
const minimumJerk = (t: number) => {
  const c = Math.min(Math.max(t, 0), 1);
  return c * c * c * (10 - 15 * c + 6 * c * c);
};
// At its height a look is never quite still: it eases off by SAG over
// SAG_SECONDS, as a held expression does.
export const SAG = 0.12;
const SAG_SECONDS = 1.2;
// Letting go, it settles back to rest as a relaxing muscle does: starting
// gently, then falling away and trailing off slowly (a damped return,
// smooth from its start, scaled so it reaches rest exactly at the end of
// its offset, RELAX time constants in). Brought back along the same curve
// it came, it stopped short as it reached rest.
const RELAX = 9;
const settle = (u: number) => (1 + u + (u * u) / 2) * Math.exp(-u);
const relaxed = (t: number) => {
  const c = Math.min(Math.max(t, 0), 1);
  const rest = settle(RELAX);
  return (settle(RELAX * (1 - c)) - rest) / (1 - rest);
};

// The passing look's strengths at `time`: each morph setting in over its
// look's onset (a lagging one starting later), easing off a little at its
// height, and letting go over its offset, so it comes and goes rather than
// switching. Rise, height and fall are multiplied, not the least of them
// taken: taking the least, a brow that followed the other late reversed in a
// single frame at its peak, and the look froze flat between rise and fall.
export function ambientFace({ face }: Ambient, time: number) {
  if (!face) return {};
  const { onset, offset } = paceOf(face.name);
  return Object.fromEntries(
    Object.entries(face.peaks).map(([morph, peak]) => {
      const from =
        face.start + (face.lags[morph] ?? 0) * (face.end - face.start);
      const held = time - from - onset;
      const strength =
        minimumJerk((time - from) / onset) *
        (1 - SAG * minimumJerk(held / SAG_SECONDS)) *
        relaxed((face.end - time) / offset);
      return [morph, peak * strength];
    }),
  );
}

// `strengths` (the face the head is making) with `face` (a passing look's
// strengths) laid over it, each at most whole.
export function withFace(
  strengths: Record<string, number>,
  face: Record<string, number>,
): Record<string, number> {
  const out = { ...strengths };
  for (const [name, strength] of Object.entries(face))
    out[name] = Math.min(1, (out[name] ?? 0) + strength);
  return out;
}
