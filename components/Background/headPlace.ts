import { HEAD_REACH } from '@/components/collageLayout';
import { WIDE_FROM } from '@/components/PageScroller/edgeFade';

// How far off the window's left edge the head's middle goes while a card
// covers it on a narrow window, in window heights: past its shoulders, which
// reach about half a window height either side of it.
export const AWAY_HEIGHTS = 0.6;

// Where across the window the head's middle goes, in pixels (HeadFraming.tsx
// moves the camera to put it there). On a narrow window, the middle of the
// screen, unless a card is showing (`covered`: the contact form, a post's
// card), which there spans the screen right over the head: then the head
// goes off the left edge, so its lenses don't show behind the card's text.
// On a wide one, the middle of the free space between the left of the
// content's `frame` (the centred, width-capped container: data-frame) and
// what the page shows beside the head (its cards, the home page's title:
// elements marked data-head-avoid), whose left edge is `freeRight`;
// undefined when the page has none. Where that space is narrower than the
// head's face, the head goes off the left edge if what is beside it is a
// card (`covered`), as on a narrow window, and otherwise to the frame's
// middle, as it does when there is nothing beside it. So on a window wider
// than the frame the head stays with the content, centred with it, rather
// than out at the window's left.
export function headCentre(
  width: number,
  height: number,
  freeRight: number | undefined,
  covered = false,
  frame = { left: 0, right: width },
): number {
  const middle = (frame.left + frame.right) / 2;
  const away = -AWAY_HEIGHTS * height;
  if (width < WIDE_FROM) return covered ? away : middle;
  if (freeRight === undefined) return middle;
  const free = freeRight - frame.left;
  // No room beside a card: it spans the frame over the head, so the head
  // goes, as on a narrow window, rather than sit behind the card's text.
  if (free < 2 * HEAD_REACH * height) return covered ? away : middle;
  return frame.left + free / 2;
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
