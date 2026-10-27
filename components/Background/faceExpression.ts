// When the face makes its expressions, from where the head is looking (the
// pointer, or the spot it wanders to when the pointer is still), in screen
// pixels, against where its eyes are on screen:
// - brows up, a little, when the spot is above the eyes, more the higher;
// - a squint, as if focusing, when the spot is far from the eyes (toward the
//   other side of the screen), more the farther;
// - a very faint smile while the head faces the camera.
// Each strength eases toward its target, so the face never jumps.

type Point = { x: number; y: number };
type Size = { width: number; height: number };

// Brows start rising when the spot is this far above the eyes, and are fully
// up by the second (shares of the screen's height).
export const BROWS_ABOVE = [0.05, 0.35] as const;
// The squint starts this far from the eyes and is full by the second (shares
// of the screen's width).
export const SQUINT_DISTANCE = [0.4, 0.7] as const;
// The squint's strength at its fullest: a light narrowing, not a hard squint.
export const SQUINT_MAX = 0.5;
// The faint smile: its strength facing the camera, and the turns (radians,
// tip and turn combined) between which it fades out.
export const FACING_SMILE = 0.25;
export const FACING = [0.04, 0.15] as const;

// How fast strengths ease toward their targets: about 1 / EASE_RATE seconds.
export const EASE_RATE = 4;

const smoothstep = (x: number, [low, high]: readonly [number, number]) => {
  const t = Math.min(Math.max((x - low) / (high - low), 0), 1);
  return t * t * (3 - 2 * t);
};

// The target strength of each expression, 0 to 1. A spot off the screen
// counts as its nearest edge.
export function pointerExpressions(
  spot: Point,
  eyes: Point,
  { width, height }: Size,
): { browsUp: number; squint: number } {
  const x = Math.min(Math.max(spot.x, 0), width);
  const y = Math.min(Math.max(spot.y, 0), height);
  return {
    browsUp: smoothstep((eyes.y - y) / height, BROWS_ABOVE),
    squint:
      SQUINT_MAX *
      smoothstep(Math.hypot(x - eyes.x, y - eyes.y) / width, SQUINT_DISTANCE),
  };
}

// A strength `seconds` later, eased from `current` toward `target` at `rate`
// (about 1 / rate seconds).
export const easeToward = (
  current: number,
  target: number,
  seconds: number,
  rate = EASE_RATE,
) => current + (target - current) * (1 - Math.exp(-rate * seconds));

// The smile's target from the head's turn (radians: x tips, y turns, both 0
// facing the camera).
export const facingSmile = ({ x, y }: Point) =>
  FACING_SMILE * (1 - smoothstep(Math.hypot(x, y), FACING));
