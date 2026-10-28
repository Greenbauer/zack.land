import { describe, expect, it } from 'vitest';

import {
  easeOutCubic,
  GLIDE_MS,
  keyDirection,
  nextPost,
  turnGate,
  wheelPager,
} from './paging';

describe('paging between posts', () => {
  const positions = [0, 708, 1416, 2124];

  it('moves to the post after or before the nearest one', () => {
    expect(nextPost(positions, 0, 1)).toBe(1);
    expect(nextPost(positions, 708, -1)).toBe(0);
    // Partway down, from the nearest post.
    expect(nextPost(positions, 800, 1)).toBe(2);
    expect(nextPost(positions, 1300, -1)).toBe(1);
  });

  it('stays on the first and last posts at the ends', () => {
    expect(nextPost(positions, 0, -1)).toBe(0);
    expect(nextPost(positions, 2124, 1)).toBe(3);
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

  it('holds a turn the same way until the next card is most of the way in', () => {
    const gate = turnGate(options);
    gate.ask(1, 0);
    expect(gate.ask(1, 300)).toBeNull();
    expect(gate.due(1399)).toBeNull();
    // Still waiting, for a timer that came a moment early to look again.
    expect(gate.waiting).toBe(1);
    expect(gate.due(1400)).toEqual({ direction: 1, quick: false });
    expect(gate.waiting).toBe(0);
    expect(gate.freeAt).toBe(2800);
  });

  it('turns back at once, quick only before the next card sets off', () => {
    const quick = turnGate(options);
    quick.ask(1, 0);
    expect(quick.ask(-1, 300)).toEqual({ direction: -1, quick: true });
    const midway = turnGate(options);
    midway.ask(1, 0);
    expect(midway.ask(-1, 1000)).toEqual({ direction: -1, quick: false });
  });

  it('keeps only the latest of a burst the same way', () => {
    const gate = turnGate(options);
    gate.ask(1, 0);
    gate.ask(1, 100);
    gate.ask(1, 200);
    expect(gate.due(1400)).toEqual({ direction: 1, quick: false });
    expect(gate.due(2800)).toBeNull();
  });

  it('drops a waiting turn when one back goes instead', () => {
    const gate = turnGate(options);
    gate.ask(1, 0);
    gate.ask(1, 100);
    gate.ask(-1, 200);
    expect(gate.waiting).toBe(0);
    expect(gate.due(1600)).toBeNull();
  });

  it('can start as if a turn is already playing', () => {
    const gate = turnGate({ ...options, playingFrom: 100 });
    expect(gate.ask(1, 500)).toBeNull();
    expect(gate.due(1500)).toEqual({ direction: 1, quick: false });
  });
});
