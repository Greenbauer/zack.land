import { describe, expect, it } from 'vitest';

import {
  easeOutCubic,
  GLIDE_MS,
  keyDirection,
  postAt,
  throughPost,
  turnGate,
  turnTo,
  wheelPager,
} from './paging';

describe('paging between posts', () => {
  // Four one-page posts, then the same with the second opened by More to
  // run on 500px past the page.
  const spans: [number, number][] = [
    [0, 0],
    [708, 708],
    [1416, 1416],
    [2124, 2124],
  ];
  const tall: [number, number][] = [
    [0, 0],
    [708, 1208],
    [1916, 1916],
    [2624, 2624],
  ];

  it('finds the post the page is on, or the nearest', () => {
    expect(postAt(spans, 0)).toBe(0);
    expect(postAt(spans, 800)).toBe(1);
    expect(postAt(spans, 1300)).toBe(2);
    // Anywhere within a tall post is on it.
    expect(postAt(tall, 708)).toBe(1);
    expect(postAt(tall, 1100)).toBe(1);
    expect(postAt(tall, 1208)).toBe(1);
  });

  it('turns to the next post, or back to the last', () => {
    expect(turnTo(spans, 0, 1)).toBe(708);
    expect(turnTo(spans, 708, -1)).toBe(0);
    expect(turnTo(spans, 800, 1)).toBe(1416);
    expect(turnTo(spans, 1300, -1)).toBe(708);
  });

  it('stays on the first and last posts at the ends', () => {
    expect(turnTo(spans, 0, -1)).toBe(0);
    expect(turnTo(spans, 2124, 1)).toBe(2124);
  });

  it('turns from the end of a tall post, and back up onto its end', () => {
    expect(turnTo(tall, 1208, 1)).toBe(1916);
    expect(turnTo(tall, 1916, -1)).toBe(1208);
    expect(turnTo(tall, 708, -1)).toBe(0);
  });

  it('scrolls through a tall post before turning, never past its end', () => {
    expect(throughPost(tall, 708, 1, 100)).toBe(808);
    expect(throughPost(tall, 1150, 1, 100)).toBe(1208);
    expect(throughPost(tall, 1208, 1, 100)).toBeNull();
    expect(throughPost(tall, 1208, -1, 100)).toBe(1108);
    expect(throughPost(tall, 750, -1, 100)).toBe(708);
    expect(throughPost(tall, 708, -1, 100)).toBeNull();
  });

  it('never scrolls within a one-page post', () => {
    expect(throughPost(spans, 708, 1, 100)).toBeNull();
    expect(throughPost(spans, 708, -1, 100)).toBeNull();
    expect(throughPost([], 0, 1, 100)).toBeNull();
    // Gliding between posts, a push turns the page rather than scrolling.
    expect(throughPost(spans, 300, -1, 100)).toBeNull();
    expect(throughPost(tall, 1500, -1, 100)).toBeNull();
    expect(throughPost(tall, 400, 1, 100)).toBeNull();
  });

  it('glides quickly, fast out and gently in', () => {
    expect(GLIDE_MS).toBeLessThanOrEqual(400);
    expect(easeOutCubic(0)).toBe(0);
    expect(easeOutCubic(1)).toBe(1);
    // Most of the way there in the first half.
    expect(easeOutCubic(0.5)).toBeGreaterThan(0.8);
  });
});

describe('turning pages with the wheel', () => {
  it('turns one page on a single notch of a mouse wheel', () => {
    const turn = wheelPager();
    expect(turn(100, 0)).toBe(1);
  });

  it('adds up small trackpad scrolls until they are enough', () => {
    const turn = wheelPager();
    expect(turn(-15, 0)).toBe(0);
    expect(turn(-15, 16)).toBe(0);
    expect(turn(-15, 32)).toBe(-1);
  });

  // A trackpad swipe: deltas growing for a moment, then its coast, shrinking
  // a little with each event, every 16 ms from `start`.
  const swipe = (start: number, direction = 1) => {
    const events: [number, number][] = [];
    let at = start;
    for (let k = 0; k < 6; k++, at += 16)
      events.push([direction * (20 + k * 15), at]);
    for (let size = 100; size > 2; size *= 0.95, at += 16)
      events.push([direction * size, at]);
    return events;
  };

  it('turns only one page for a whole swipe, its coast included', () => {
    const turn = wheelPager();
    const turns = swipe(0).map(([delta, at]) => turn(delta, at));
    expect(turns.filter((t) => t !== 0)).toEqual([1]);
  });

  // One swipe as a trackpad really sends it: its push rising unevenly and
  // its coast wavering, a delta every 16 ms.
  const turnsFor = (deltas: number[]) => {
    const turn = wheelPager();
    return deltas.map((delta, k) => turn(delta, k * 16)).filter((t) => t);
  };

  it('turns only one page for a swipe whose push rises unevenly', () => {
    expect(
      turnsFor([10, 25, 22, 40, 60, 55, 80, 95, 90, 70, 50, 30, 15, 5]),
    ).toEqual([1]);
  });

  it('turns only one page for a swipe whose coast wavers', () => {
    expect(
      turnsFor([20, 50, 90, 80, 70, 60, 61, 62, 55, 50, 51, 53, 45, 30, 10]),
    ).toEqual([1]);
  });

  it('turns again for a second swipe made while the first still coasts', () => {
    const turn = wheelPager();
    const first = swipe(0);
    // The second swipe starts half a second in, mid-coast.
    const second = swipe(500);
    const events = [...first.filter(([, at]) => at < 500), ...second];
    const turns = events.map(([delta, at]) => turn(delta, at));
    expect(turns.filter((t) => t !== 0)).toEqual([1, 1]);
  });

  it('turns a page for every quick swipe, without waiting for the glide', () => {
    const turn = wheelPager();
    // Three swipes 200 ms apart, each cutting the last one's coast short.
    const events = [0, 200, 400].flatMap((start, k, starts) =>
      swipe(start).filter(([, at]) => k === 2 || at < starts[k + 1]!),
    );
    const turns = events.map(([delta, at]) => turn(delta, at));
    expect(turns.filter((t) => t !== 0)).toEqual([1, 1, 1]);
  });

  it('keeps turning pages while a mouse wheel spins', () => {
    const turn = wheelPager();
    const turns = [];
    // Notches every 60 ms for half a second: a page every other notch.
    for (let at = 0; at < 500; at += 60) turns.push(turn(100, at));
    expect(turns.filter((t) => t !== 0)).toHaveLength(5);
  });

  it('does not count one notch twice', () => {
    const turn = wheelPager();
    expect(turn(100, 0)).toBe(1);
    expect(turn(100, 60)).toBe(0);
    expect(turn(100, 120)).toBe(1);
  });

  // Notches of a mouse wheel: three down, `gap` ms apart, then one up.
  const burstThenBack = (gap: number) => {
    const turn = wheelPager();
    const gate = turnGate({ holdMs: 1400, quickMs: 700 });
    let post = 0;
    for (const [delta, at] of [
      [100, 0],
      [100, gap],
      [100, 2 * gap],
      [-100, 3 * gap],
    ] as const) {
      const direction = turn(delta, at);
      const next = direction ? gate.ask(direction, at) : null;
      if (next) post += next.direction;
    }
    return post;
  };

  it('turns back for a notch the other way right after a burst', () => {
    // Within half a second, at any spacing, it ends back on the first post.
    expect(burstThenBack(60)).toBe(0);
    expect(burstThenBack(100)).toBe(0);
    expect(burstThenBack(130)).toBe(0);
  });

  it('never turns back on a coast that wavers the other way', () => {
    const turn = wheelPager();
    expect(turn(100, 0)).toBe(1);
    // A swipe's coast with a tiny flick back in it: no turn either way.
    const coast = [60, 40, -2, 30, 20, 10, 5].map((d, k) =>
      turn(d, 16 + k * 16),
    );
    expect(coast.filter((t) => t !== 0)).toEqual([]);
  });

  it('turns again once the wheel has been quiet', () => {
    const turn = wheelPager();
    expect(turn(100, 0)).toBe(1);
    expect(turn(100, 100)).toBe(0);
    expect(turn(100, 400)).toBe(1);
  });
});

describe('turning pages with the keyboard', () => {
  it('pages with the arrows, page keys and space', () => {
    expect(keyDirection('ArrowDown', false)).toBe(1);
    expect(keyDirection('PageDown', false)).toBe(1);
    expect(keyDirection(' ', false)).toBe(1);
    expect(keyDirection('ArrowUp', false)).toBe(-1);
    expect(keyDirection('PageUp', false)).toBe(-1);
    expect(keyDirection(' ', true)).toBe(-1);
    expect(keyDirection('a', false)).toBe(0);
  });
});

describe('spacing page turns out', () => {
  const options = { holdMs: 1400, quickMs: 700 };

  it('turns at once when nothing is playing', () => {
    const gate = turnGate(options);
    expect(gate.ask(1, 0)).toEqual({ direction: 1, quick: false });
    expect(gate.ask(1, 1400)).toEqual({ direction: 1, quick: false });
  });

  it('lets a push the same way go while the next card comes in, keeping none for later', () => {
    const gate = turnGate(options);
    gate.ask(1, 0);
    // A long swipe's later pushes, or a wheel spun on: none turns a page.
    expect(gate.ask(1, 300)).toBeNull();
    expect(gate.ask(1, 1000)).toBeNull();
    // Once the card is most of the way in, a fresh push turns at once.
    expect(gate.ask(1, 1400)).toEqual({ direction: 1, quick: false });
  });

  it('turns one page for a scroll that goes on past the hold', () => {
    const gate = turnGate(options);
    gate.ask(1, 0);
    // A wheel spun on for two seconds, a push every 120 ms: still one page.
    for (let at = 120; at <= 2040; at += 120)
      expect(gate.ask(1, at)).toBeNull();
    // Once it pauses, the next push turns the next page.
    expect(gate.ask(1, 2400)).toEqual({ direction: 1, quick: false });
  });

  it('turns back at once, quick only before the next card sets off', () => {
    const quick = turnGate(options);
    quick.ask(1, 0);
    expect(quick.ask(-1, 300)).toEqual({ direction: -1, quick: true });
    const midway = turnGate(options);
    midway.ask(1, 0);
    expect(midway.ask(-1, 1000)).toEqual({ direction: -1, quick: false });
  });

  it('can start as if a turn is already playing', () => {
    const gate = turnGate({ ...options, playingFrom: 100 });
    expect(gate.ask(1, 500)).toBeNull();
    expect(gate.ask(1, 1500)).toEqual({ direction: 1, quick: false });
  });
});
