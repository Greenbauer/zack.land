import { HEAD_REACH } from '@/components/collageLayout';
import { WIDE_FROM } from '@/components/PageScroller/edgeFade';

// Where across the window the head's middle goes, in pixels (HeadFraming.tsx
// moves the camera to put it there). On a narrow window, the middle of the
// screen. On a wide one, the middle of the free space left of what the page
// shows beside it (its cards, the home page's title: elements marked
// data-head-avoid), whose left edge is `freeRight`; undefined when the page
// has none. Where that space is narrower than the head's face, the head
// goes back to the middle of the screen.
export function headCentre(
  width: number,
  height: number,
  freeRight: number | undefined,
): number {
  if (width < WIDE_FROM || freeRight === undefined) return width / 2;
  if (freeRight < 2 * HEAD_REACH * height) return width / 2;
  return freeRight / 2;
}

// Where the head's middle is this frame, gliding toward headCentre, and how
// fast it is moving (pixels a second); x is NaN until the scene's first
// frame.
export const framedHead = { x: Number.NaN, speed: 0 };

// About how long the head takes to glide to a new place, in seconds.
export const GLIDE_SECONDS = 0.9;

// One step of the head's glide toward `target`, over `seconds`: a critically
// damped spring (the closed-form step from Game Programming Gems 4, 1.10),
// so it sets off gently, picks up speed, and slows into place without
// overshooting, and a target that moves mid-glide bends its path rather than
// jerking it. It moves the same at any frame rate.
export function glide(
  { x, speed }: { x: number; speed: number },
  target: number,
  seconds: number,
  glideSeconds = GLIDE_SECONDS,
) {
  // A spring this stiff covers most of the way in about glideSeconds.
  const omega = 4 / glideSeconds;
  const t = omega * seconds;
  const decay = 1 / (1 + t + 0.48 * t * t + 0.235 * t * t * t);
  const offset = x - target;
  const pull = (speed + omega * offset) * seconds;
  return {
    x: target + (offset + pull) * decay,
    speed: (speed - omega * pull) * decay,
  };
}

// The point the pointer's look is measured from (index.tsx, and back again in
// MyHead.tsx): a twelfth of the window right of the head's middle, which
// keeps the head's turn toward the pointer as it was tuned with the head a
// quarter of the way across.
export const lookOrigin = (width: number) =>
  (Number.isNaN(framedHead.x) ? width / 2 : framedHead.x) + width / 12;
