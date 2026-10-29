// What the head does when it is tapped on a touch screen (MyHead.tsx): it
// turns quickly to face the camera, angry and surprised; a second tap does
// the same, a third makes it really angry, and a fourth starts over. Left
// alone for REACT_SECONDS, it blends into a smile held for SMILE_SECONDS,
// then goes back to looking around.

export type HeadTaps =
  | { phase: 'none' }
  | { phase: 'reacting'; count: 1 | 2 | 3; since: number }
  | { phase: 'smiling'; since: number };

// How long the head holds its reaction after the last tap, in seconds.
export const REACT_SECONDS = 2.5;
// How long the smile after it is held, in seconds.
export const SMILE_SECONDS = 2.5;
// How quickly the head turns to the camera when tapped: the share of the way
// it turns each 60th of a second (shareOver), well above its usual 0.05.
export const TAP_TURN_SPEED = 0.2;

export const untapped: HeadTaps = { phase: 'none' };

// The head tapped at `time` (seconds): the next of the three reactions, or the
// first again after the third or once the last has eased into a smile.
export function tapHead(taps: HeadTaps, time: number): HeadTaps {
  const count =
    taps.phase === 'reacting' ? (((taps.count % 3) + 1) as 1 | 2 | 3) : 1;
  return { phase: 'reacting', count, since: time };
}

// The next step at `time`: the reaction gives way to the smile, and the
// smile to looking around.
export function stepTaps(taps: HeadTaps, time: number): HeadTaps {
  if (taps.phase === 'reacting' && time - taps.since >= REACT_SECONDS)
    return { phase: 'smiling', since: time };
  if (taps.phase === 'smiling' && time - taps.since >= SMILE_SECONDS)
    return untapped;
  return taps;
}

// Whether a tap's reaction is under way (the head faces the camera and only
// these expressions show).
export const tapsOn = (taps: HeadTaps) => taps.phase !== 'none';

// The expression strengths for each step (morph targets of head.bin): angry
// and surprised is the gasp's open jaw with the squint's narrowed eyes and
// lowered inner brows; really angry is the pout with a full squint.
export function tapExpressions(taps: HeadTaps): Record<string, number> {
  if (taps.phase === 'smiling') return { smile: 1 };
  if (taps.phase !== 'reacting') return {};
  return taps.count === 3 ? { pout: 1, squint: 1 } : { gasp: 0.8, squint: 0.7 };
}
