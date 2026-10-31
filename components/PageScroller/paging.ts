// Paging the portfolio's posts: one wheel turn, swipe or key press moves
// straight to the next post (or back) in a short, quick glide, instead of
// the browser's own snapping, which waits for the scroll to settle first.
// A push the same way while the last turn's next card is still coming in is
// let go (turnGate), so one scroll turns one page; a turn back goes at once,
// its cards reversing from wherever they are (Post.tsx).

// How long the glide to the next post takes, in milliseconds.
export const GLIDE_MS = 300;

// Fast out, gentle stop.
export const easeOutCubic = (t: number) => 1 - (1 - t) ** 3;

// The pause before a page turn's next card sets off while the last card
// leaves, in milliseconds (Post.tsx's --turn-delay, 0.7s by default): a turn
// back inside it is quick, as that card has not set off yet.
export const QUICK_MS = 700;
// How long after a turn a push the same way is let go, in milliseconds: the
// pause and most of the next card's slide in, so it never sets off across
// the whole window only to be sent straight back out, and a long or uneven
// swipe, or a mouse wheel spun on, turns one page, not two.
export const HOLD_MS = 1400;
// And for as long as pushes the same way keep coming, until they pause this
// long, in milliseconds: one scroll, however long or uneven, turns one page.
export const GESTURE_GAP_MS = 300;

// Spaces page turns out: a push the same way as the last turn, inside
// `holdMs` of it, or within `gapMs` of the last such push (a wheel spun on,
// a swipe still going), is let go rather than kept for later (kept, it
// turned a second page as the first card landed, so a post flashed past). A
// turn
// back the other way goes at once, its cards reversing from wherever they
// are, and is `quick` inside `quickMs`: the card it turns away from has not
// set off, so the card it brings back need not wait for it. `ask` says
// whether to turn now. Given `playingFrom`, it starts as if a turn began
// then (the first card arriving as the page loads), so the wheel's or a
// swipe's push left over from the last page lets go; a `pressed` ask (a
// scroll arrow, shown and enabled) is not held by that, only by real turns.
export function turnGate({
  holdMs = HOLD_MS,
  quickMs = QUICK_MS,
  gapMs = GESTURE_GAP_MS,
  playingFrom = -Infinity,
} = {}) {
  let turnedAt = -Infinity;
  let askedAt = -Infinity;
  let last: 1 | -1 | 0 = 0;
  const go = (direction: 1 | -1, now: number, quick: boolean) => {
    last = direction;
    turnedAt = now;
    return { direction, quick };
  };
  return {
    ask(direction: 1 | -1, now: number, pressed = false) {
      const lastAsked = askedAt;
      askedAt = now;
      if (last && direction !== last)
        return go(direction, now, now - turnedAt < quickMs);
      if (!last && !pressed && now - playingFrom < holdMs) return null;
      if (now - turnedAt < holdMs || now - lastAsked < gapMs) return null;
      return go(direction, now, false);
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
// turns the page instead (turnIndex).
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

// The post a page turn down (1) or up (-1) goes to from `scrollTop`, by its
// index in `spans`, or null past the first and last.
export function turnIndex(
  spans: readonly (readonly [number, number])[],
  scrollTop: number,
  direction: 1 | -1,
): number | null {
  const next = postAt(spans, scrollTop) + direction;
  return next >= 0 && next < spans.length ? next : null;
}

// Where a turn lands on post `span`: its top going down, its bottom (its
// end, if it is taller than the page, as scrolling up reaches it) going up.
export const landing = (span: readonly [number, number], direction: 1 | -1) =>
  direction > 0 ? span[0] : span[1];

// How far down post `span` the page at `scrollTop` is, to keep it there
// (keptPlace): its distance from the post's top, or, at the end of a post
// taller than the page (as paging back up onto it lands), Infinity, so it
// stays at the end however the post's height changes.
export const placeIn = (span: readonly [number, number], scrollTop: number) =>
  span[1] > span[0] && scrollTop >= span[1] - 1
    ? Infinity
    : scrollTop - span[0];

// Where the page goes when the posts change height under it (the footer's
// text coming or going changes --post-height, a window resized or turned, a
// post opened by More closing above it): back on the post it was on,
// `offset` pixels down it as it was (placeIn), no further than its end.
export const keptPlace = (span: readonly [number, number], offset: number) =>
  Math.min(span[0] + Math.max(0, offset), span[1]);

// Turns a stream of wheel events into page turns. Once the scroll in one
// direction adds up to `threshold` pixels it turns a page; it turns another
// as soon as the wheel is pushed afresh, with no wait for the glide: a new
// swipe (once the last push has peaked, its deltas grow again, `rising`
// times running, to at least `afresh` times the lowest they fell to, so the
// jitter in one swipe's push or coast is not taken for another) or
// another notch of a mouse wheel (large and even, `notchGapMs` after the
// last turn). The coast a trackpad keeps sending for a second or so after a
// swipe only shrinks, so it never turns another page. A push the other way
// is never held back as part of the last turn: it adds up toward its own
// turn at once, so a notch back right after a burst turns back. A quiet
// wheel (`quietMs`) starts over.
export function wheelPager({
  threshold = 40,
  quietMs = 180,
  notch = 50,
  notchGapMs = 120,
  rising = 2,
  afresh = 2,
} = {}) {
  let sum = 0;
  let lastAt = -Infinity;
  let turnedAt = -Infinity;
  let spent = false;
  // The way the last turn went.
  let lastTurn: 1 | -1 | 0 = 0;
  // The last delta's size, how many deltas running have grown, and the
  // lowest they have fallen to since the last turn's push peaked (Infinity
  // until they fall).
  let previous = 0;
  let growing = 0;
  let trough = Infinity;
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
    if (size < previous) trough = Math.min(trough, size);
    previous = size;
    if (spent && Math.sign(deltaY) === lastTurn) {
      const swipe = growing >= rising && size >= afresh * trough;
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
    trough = Infinity;
    turnedAt = now;
    const direction = sum > 0 ? 1 : -1;
    lastTurn = direction;
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
