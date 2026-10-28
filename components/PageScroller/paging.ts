// Paging the portfolio's posts: one wheel turn, swipe or key press moves
// straight to the next post (or back) in a short, quick glide, instead of
// the browser's own snapping, which waits for the scroll to settle first.
// A turn the same way waits for the last turn's next card to come most of
// the way in (turnGate); a turn back goes at once, its cards reversing from
// wherever they are (Post.tsx).

// How long the glide to the next post takes, in milliseconds.
export const GLIDE_MS = 300;

// Fast out, gentle stop.
export const easeOutCubic = (t: number) => 1 - (1 - t) ** 3;

// The pause before a page turn's next card sets off while the last card
// leaves, in milliseconds (Post.tsx's --turn-delay, 0.7s by default): a turn
// back inside it is quick, as that card has not set off yet.
export const QUICK_MS = 700;
// How long a turn the same way waits after the last, in milliseconds: the
// pause and most of the next card's slide in, so it never sets off across
// the whole window only to be sent straight back out.
export const HOLD_MS = 1400;

// Spaces page turns out: a turn the same way as the last waits `holdMs`
// after it, and only the latest one asked for waits, so a burst of pushes
// turns a page at a time. A turn back the other way goes at once, its cards
// reversing from wherever they are, and is `quick` inside `quickMs`: the card
// it turns away from has not set off, so the card it brings back need not
// wait for it. `ask` says whether to turn now; `due` gives the waiting turn
// once it may go, and `freeAt` when that is. Given `playingFrom`, it starts
// as if a turn began then (the first card arriving as the page loads).
export function turnGate({
  holdMs = HOLD_MS,
  quickMs = QUICK_MS,
  playingFrom = -Infinity,
} = {}) {
  let turnedAt = playingFrom;
  let freeAt = playingFrom + holdMs;
  let last: 1 | -1 | 0 = 0;
  let waiting: 1 | -1 | 0 = 0;
  const go = (direction: 1 | -1, now: number, quick: boolean) => {
    last = direction;
    waiting = 0;
    turnedAt = now;
    freeAt = now + holdMs;
    return { direction, quick };
  };
  return {
    ask(direction: 1 | -1, now: number) {
      if (last && direction !== last)
        return go(direction, now, now - turnedAt < quickMs);
      if (now >= freeAt) return go(direction, now, false);
      waiting = direction;
      return null;
    },
    due(now: number) {
      return waiting && now >= freeAt ? go(waiting, now, false) : null;
    },
    get freeAt() {
      return freeAt;
    },
    get waiting() {
      return waiting;
    },
  };
}

// The post the page is on at `scrollTop`, given each post's span (postSpans):
// the one whose span holds it, or else the nearest.
export function postAt(
  spans: readonly (readonly [number, number])[],
  scrollTop: number,
): number {
  let at = 0;
  let nearest = Infinity;
  spans.forEach(([start, end], k) => {
    const gap = Math.max(start - scrollTop, scrollTop - end, 0);
    if (gap < nearest) {
      at = k;
      nearest = gap;
    }
  });
  return at;
}

// Where a push down (1) or up (-1) of `step` pixels scrolls the page while
// it is within a post that runs on past the page that way (one More has
// opened taller than the page): on through it, no further than its end. Null
// once the page is at that end, or between posts (gliding), when the push
// turns the page instead (turnTo).
export function throughPost(
  spans: readonly (readonly [number, number])[],
  scrollTop: number,
  direction: 1 | -1,
  step: number,
): number | null {
  if (!spans.length) return null;
  const [start, end] = spans[postAt(spans, scrollTop)]!;
  if (end <= start || scrollTop < start - 1 || scrollTop > end + 1) return null;
  if (direction > 0 && scrollTop < end - 1)
    return Math.min(end, scrollTop + step);
  if (direction < 0 && scrollTop > start + 1)
    return Math.max(start, scrollTop - step);
  return null;
}

// Where a page turn down (1) or up (-1) goes from `scrollTop`: the next
// post's top, or the last post's bottom (its end, if it is taller than the
// page, as scrolling up reaches it), or nowhere past the first and last.
export function turnTo(
  spans: readonly (readonly [number, number])[],
  scrollTop: number,
  direction: 1 | -1,
): number {
  const at = postAt(spans, scrollTop);
  const next = spans[at + direction];
  if (!next) return scrollTop;
  return direction > 0 ? next[0] : next[1];
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
