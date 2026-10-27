// Paging the portfolio's posts: one wheel turn, swipe or key press moves
// straight to the next post (or back) in a short, quick glide, instead of
// the browser's own snapping, which waits for the scroll to settle first.
// Quick pushes chain: each one adds a post to where the glide is headed.

// How long the glide to the next post takes, in milliseconds.
export const GLIDE_MS = 300;

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

// Turns a stream of wheel events into page turns. Once the scroll in one
// direction adds up to `threshold` pixels it turns a page; it turns another
// as soon as the wheel is pushed afresh, with no wait for the glide: a new
// swipe (once the last push has peaked, its deltas grow again, `rising`
// times running) or
// another notch of a mouse wheel (large and even, `notchGapMs` after the
// last turn). The coast a trackpad keeps sending for a second or so after a
// swipe only shrinks, so it never turns another page. A quiet wheel
// (`quietMs`) starts over.
export function wheelPager({
  threshold = 40,
  quietMs = 180,
  notch = 50,
  notchGapMs = 120,
  rising = 2,
} = {}) {
  let sum = 0;
  let lastAt = -Infinity;
  let turnedAt = -Infinity;
  let spent = false;
  // The last delta's size, how many deltas running have grown, and whether
  // they have fallen since the last turn (its push has peaked).
  let previous = 0;
  let growing = 0;
  let fallen = false;
  // The recent deltas' sizes, to tell a mouse notch from a coast.
  let recent: { at: number; size: number }[] = [];
  return (deltaY: number, now: number): 1 | -1 | 0 => {
    if (now - lastAt > quietMs) {
      spent = false;
      sum = 0;
      recent = [];
      previous = 0;
    }
    lastAt = now;
    const size = Math.abs(deltaY);
    recent = recent.filter(({ at }) => now - at < 120);
    const largest = Math.max(0, ...recent.map((r) => r.size));
    recent.push({ at: now, size });
    growing = size > previous ? growing + 1 : 0;
    if (size < previous) fallen = true;
    previous = size;
    if (spent) {
      const swipe = fallen && growing >= rising;
      const notched =
        size >= notch && size >= largest && now - turnedAt >= notchGapMs;
      if (!swipe && !notched) return 0;
      spent = false;
      sum = 0;
    }
    sum += deltaY;
    if (Math.abs(sum) < threshold) return 0;
    spent = true;
    growing = 0;
    fallen = false;
    turnedAt = now;
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
