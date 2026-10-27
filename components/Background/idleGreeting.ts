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
