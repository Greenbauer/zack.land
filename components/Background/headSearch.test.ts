import { describe, expect, it } from 'vitest';

import {
  Search,
  SEARCH_FACE,
  searchOver,
  startSearch,
  stepSearch,
} from './headSearch';
import { seeded } from './seeded';
import { TIP, TURN } from './wander';

// A search from `from`, every frame at 60 a second until it gives up.
function run(from: { x: number; y: number }, seed: number) {
  let search = startSearch(from, 0, seeded(seed));
  const frames: { time: number; search: Search }[] = [];
  for (let k = 1; !searchOver(search) && k < 600; k++) {
    search = stepSearch(search, k / 60, 1 / 60);
    frames.push({ time: k / 60, search });
  }
  return frames;
}

describe('the head looking for the pointer it lost', () => {
  it('glances on past where it lost it, across the other way, then partway back', () => {
    for (const seed of [1, 2, 3, 4, 5]) {
      const from = { x: 0, y: 0.15 };
      const [past, across, back] = startSearch(from, 0, seeded(seed)).glances;
      expect(past!.target.y).toBeGreaterThan(from.y);
      expect(across!.target.y).toBeLessThan(from.y - 0.25);
      expect(back!.target.y).toBeLessThan(from.y);
      expect(back!.target.y).toBeGreaterThan(across!.target.y);
    }
    // Lost to the other side, it searches the other way first.
    const [past] = startSearch({ x: 0, y: -0.3 }, 0, seeded(1)).glances;
    expect(past!.target.y).toBeLessThan(-0.3);
  });

  it('stays inside the turning range, even lost at its edge', () => {
    for (const seed of [1, 2, 3])
      for (const from of [
        { x: TIP[0], y: TURN[0] },
        { x: TIP[1], y: TURN[1] },
      ])
        for (const { search } of run(from, seed)) {
          expect(search.gaze.y).toBeGreaterThanOrEqual(TURN[0]);
          expect(search.gaze.y).toBeLessThanOrEqual(TURN[1]);
          expect(search.gaze.x).toBeGreaterThanOrEqual(TIP[0]);
          expect(search.gaze.x).toBeLessThanOrEqual(TIP[1]);
        }
  });

  it('is quick, a few seconds in all, and gives up', () => {
    for (const seed of [1, 2, 3, 4, 5]) {
      const frames = run({ x: 0, y: 0 }, seed);
      const seconds = frames.at(-1)!.time;
      expect(seconds).toBeGreaterThan(2.5);
      expect(seconds).toBeLessThan(4.5);
      expect(searchOver(frames.at(-1)!.search)).toBe(true);
    }
  });

  it('moves smoothly, with no jump from one frame to the next', () => {
    const frames = run({ x: 0, y: 0.1 }, 3);
    for (let k = 1; k < frames.length; k++) {
      const a = frames[k - 1]!.search.gaze;
      const b = frames[k]!.search.gaze;
      // Under 2.5 radians a second.
      expect(Math.hypot(b.x - a.x, b.y - a.y)).toBeLessThan(2.5 / 60);
    }
  });

  it('frowns a little as it looks, its mouth closed', () => {
    for (const strength of Object.values(SEARCH_FACE))
      expect(strength).toBeLessThanOrEqual(0.35);
    expect(Object.keys(SEARCH_FACE)).not.toContain('jawOpen');
  });
});
