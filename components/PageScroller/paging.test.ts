import { describe, expect, it } from 'vitest';

import {
  easeOutCubic,
  GLIDE_MS,
  keyDirection,
  nextPost,
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

  it('turns only one page for a whole gesture, its glide included', () => {
    const turn = wheelPager();
    const turns = [];
    // A swipe and its glide: events every 16 ms for a second.
    for (let at = 0; at < 1000; at += 16) turns.push(turn(60, at));
    expect(turns.filter((t) => t !== 0)).toEqual([1]);
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
