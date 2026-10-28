// What the head does when the pointer has been still long enough for it to
// start moving on its own: first it turns to face the camera while its face
// eases back to neutral, then, as soon as it arrives with a neutral face,
// holds a surprised look for SURPRISE_SECONDS, blends from it into a smile
// held for SMILE_SECONDS, and only then starts wandering.
// Moving the pointer cancels it at any point.

export type Greeting =
  | { phase: 'idle' }
  | { phase: 'facing' }
  | { phase: 'surprised'; since: number }
  | { phase: 'smiling'; since: number }
  | { phase: 'done' };

// How long the surprised look is held, in seconds.
export const SURPRISE_SECONDS = 4;
// How long the smile after it is held, in seconds.
export const SMILE_SECONDS = 3;
// How fast the greeting's expressions ease in and out (about 1 / rate
// seconds): quicker than the face's reactions to the pointer, so the face
// snaps to surprised and then to the smile.
export const GREETING_EASE_RATE = 12;
// How close to straight at the camera (radians, tip and turn combined) the
// head has to be for the surprise to start: as it arrives, before its turn's
// slow last settling.
export const FACING_CLOSE = 0.1;

export const idle: Greeting = { phase: 'idle' };

// The next step: `turn` is where the head is looking now (radians, both 0
// facing the camera), `neutral` whether the face has eased back to no
// expression, and `time` the clock in seconds.
export function stepGreeting(
  greeting: Greeting,
  {
    turn,
    neutral,
    time,
  }: { turn: { x: number; y: number }; neutral: boolean; time: number },
): Greeting {
  if (
    greeting.phase === 'facing' &&
    neutral &&
    Math.hypot(turn.x, turn.y) < FACING_CLOSE
  )
    return { phase: 'surprised', since: time };
  if (
    greeting.phase === 'surprised' &&
    time - greeting.since >= SURPRISE_SECONDS
  )
    return { phase: 'smiling', since: time };
  if (greeting.phase === 'smiling' && time - greeting.since >= SMILE_SECONDS)
    return { phase: 'done' };
  return greeting;
}

// Whether the greeting is under way (the head faces the camera and only the
// greeting's expressions show).
export const greetingOn = (greeting: Greeting) =>
  greeting.phase !== 'idle' && greeting.phase !== 'done';

// The greeting's expression strengths: the gasp while surprised, the smile
// while smiling (each eases, so one blends into the other).
export const greetingExpressions = (greeting: Greeting) => ({
  gasp: greeting.phase === 'surprised' ? 1 : 0,
  smile: greeting.phase === 'smiling' ? 1 : 0,
});

// Whether the face can be seen clearly, so the greeting may run (MyHead.tsx
// holds its clock otherwise): the page in front of the person (`visible`,
// its tab showing; `focused`, its window the focused one), the face in the
// frame (`headX`, where it sits across the window: below 0 when it has
// stepped off the left edge, NaN before it is placed), and nothing blurring
// or covering it (`covered`).
export const faceSeen = (page: {
  visible: boolean;
  focused: boolean;
  headX: number;
  covered: boolean;
}) => page.visible && page.focused && page.headX >= 0 && !page.covered;

// The longest gap between frames, in seconds, that counts as the page being
// watched all along: a hidden tab draws no frames, though the clock runs on.
export const FRAME_GAP = 0.5;

// When the greeting's idle clock started, as of a frame at `time` (seconds):
// it starts over on a frame the face can't be seen (`seen`, faceSeen), and on
// the first frame after a gap of more than FRAME_GAP since the last
// (`lastFrame`), so time spent away from the page never counts toward it.
export const idleStart = (
  since: number,
  { time, lastFrame, seen }: { time: number; lastFrame: number; seen: boolean },
) => (!seen || time - lastFrame > FRAME_GAP ? time : since);
