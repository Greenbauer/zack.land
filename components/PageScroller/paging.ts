// Paging the portfolio's posts: one wheel turn, swipe or key press moves
// straight to the next post (or back) in a short, quick glide, instead of
// the browser's own snapping, which waits for the scroll to settle first.

// How long the glide to the next post takes, in milliseconds.
export const GLIDE_MS = 350;

// Fast out, gentle stop.
export const easeOutCubic = (t: number) => 1 - (1 - t) ** 3;

// The post to move to: the one after (direction 1) or before (-1) the one
// nearest `scrollTop`, given each post's scroll position, in order.
export function nextPost(
  positions: readonly number[],
  scrollTop: number,
  direction: 1 | -1,
): number {
  let nearest = 0;
  positions.forEach((at, k) => {
    if (Math.abs(at - scrollTop) < Math.abs(positions[nearest]! - scrollTop))
      nearest = k;
  });
  return Math.min(Math.max(nearest + direction, 0), positions.length - 1);
}

// Turns a stream of wheel events into page turns: once the scroll in one
// direction adds up to `threshold` pixels it turns a page, then ignores the
// rest of that gesture (a trackpad's glide keeps sending events for a second
// or so) until the wheel has been quiet for `quietMs`.
export function wheelPager({ threshold = 40, quietMs = 180 } = {}) {
  let sum = 0;
  let lastAt = -Infinity;
  let spent = false;
  return (deltaY: number, now: number): 1 | -1 | 0 => {
    if (now - lastAt > quietMs) {
      spent = false;
      sum = 0;
    }
    lastAt = now;
    if (spent) return 0;
    sum += deltaY;
    if (Math.abs(sum) < threshold) return 0;
    spent = true;
    const direction = sum > 0 ? 1 : -1;
    sum = 0;
    return direction;
  };
}

// The direction a key pages in, or 0 for a key that doesn't.
export function keyDirection(key: string, shiftKey: boolean): 1 | -1 | 0 {
  if (key === 'ArrowDown' || key === 'PageDown') return 1;
  if (key === 'ArrowUp' || key === 'PageUp') return -1;
  if (key === ' ') return shiftKey ? -1 : 1;
  return 0;
}
