// The pointer's trail, shared by the 3D scene's glass lenses
// (Background/pointerTrail.ts) and the bend over the page's images and
// videos (MediaBend.tsx): soft ink laid along the pointer's path, fading
// the same at any frame rate. After the mouse effect on tamasolajos.com.

// The ink's reach either side of the pointer's path, in CSS pixels.
export const TRAIL_RADIUS_PX = 70;
// How much of the ink is left after a second.
export const TRAIL_KEEP_PER_SECOND = 0.15;
// How long after the pointer stops the trail is still drawn; by then less
// than a thousandth of the ink is left.
export const TRAIL_SECONDS = 4;

// How much of the ink is left after `seconds`.
export const inkLeft = (seconds: number) =>
  TRAIL_KEEP_PER_SECOND ** Math.max(seconds, 0);

// Whether the trail still shows, `seconds` after the pointer last moved.
export const trailShows = (seconds: number) => seconds < TRAIL_SECONDS;

// Whether a pointer event leaves a trail: a mouse's or a pen's, not a
// finger's (it scrolls the page), and not where motion is reduced.
export const leavesTrail = (event: PointerEvent) =>
  event.pointerType !== 'touch' &&
  !matchMedia('(prefers-reduced-motion: reduce)').matches;

// The pointer's path as marks (window CSS pixels, and the time in seconds
// each was made), newest last: a new mark once the pointer has gone
// MARK_EVERY_PX from the last, which otherwise follows it. At most
// PATH_MARKS, none older than TRAIL_SECONDS.
export type Mark = { x: number; y: number; t: number };
export const PATH_MARKS = 32;
const MARK_EVERY_PX = 16;

export function addMark(path: Mark[], x: number, y: number, t: number) {
  const live = path.filter((mark) => trailShows(t - mark.t));
  const last = live.at(-1);
  const before = live.at(-2);
  // The newest mark follows the pointer until it is far enough from the one
  // before it to stay.
  if (
    last &&
    before &&
    Math.hypot(last.x - before.x, last.y - before.y) < MARK_EVERY_PX
  )
    live.pop();
  return [...live, { x, y, t }].slice(-PATH_MARKS);
}

// Whether the path still shows at `t`.
export const pathShows = (path: Mark[], t: number) =>
  path.length > 0 && trailShows(t - path.at(-1)!.t);

// Whether the ink reaches the box (window CSS pixels) at `t`.
export function inkReaches(
  path: Mark[],
  box: { left: number; top: number; right: number; bottom: number },
  t: number,
) {
  return path.some(
    ({ x, y, t: made }) =>
      trailShows(t - made) &&
      x > box.left - TRAIL_RADIUS_PX &&
      x < box.right + TRAIL_RADIUS_PX &&
      y > box.top - TRAIL_RADIUS_PX &&
      y < box.bottom + TRAIL_RADIUS_PX,
  );
}
