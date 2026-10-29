import { describe, expect, it } from 'vitest';

import {
  addMark,
  inkLeft,
  inkReaches,
  Mark,
  PATH_MARKS,
  pathShows,
  TRAIL_KEEP_PER_SECOND,
  TRAIL_RADIUS_PX,
  TRAIL_SECONDS,
  trailShows,
} from './pointerInk';

describe("the pointer's trail", () => {
  it('fades the same at any frame rate', () => {
    const at60 = Array.from({ length: 60 }, () => inkLeft(1 / 60)).reduce(
      (a, b) => a * b,
    );
    const at24 = Array.from({ length: 24 }, () => inkLeft(1 / 24)).reduce(
      (a, b) => a * b,
    );
    expect(at60).toBeCloseTo(TRAIL_KEEP_PER_SECOND, 6);
    expect(at24).toBeCloseTo(TRAIL_KEEP_PER_SECOND, 6);
    expect(inkLeft(0)).toBe(1);
  });

  it('stops drawing once next to no ink is left', () => {
    expect(inkLeft(TRAIL_SECONDS)).toBeLessThan(0.001);
    expect(trailShows(0)).toBe(true);
    expect(trailShows(TRAIL_SECONDS - 0.1)).toBe(true);
    expect(trailShows(TRAIL_SECONDS)).toBe(false);
  });
});

describe("the pointer's path", () => {
  it('marks the path every so often, the newest following the pointer', () => {
    let path = addMark([], 0, 0, 0);
    path = addMark(path, 5, 0, 0.01);
    path = addMark(path, 10, 0, 0.02);
    // Under 16px from the first mark: the second follows the pointer.
    expect(path.map(({ x }) => x)).toEqual([0, 10]);
    path = addMark(path, 30, 0, 0.03);
    path = addMark(path, 31, 0, 0.04);
    // 30 was far enough from 0 to stay; 31 follows on from it.
    expect(path.map(({ x }) => x)).toEqual([0, 30, 31]);
  });

  it('keeps at most PATH_MARKS, none past TRAIL_SECONDS', () => {
    let path: Mark[] = [];
    for (let k = 0; k < 100; k++) path = addMark(path, k * 20, 0, k * 0.01);
    expect(path).toHaveLength(PATH_MARKS);
    expect(path.at(-1)!.x).toBe(99 * 20);
    path = addMark(path, 0, 500, TRAIL_SECONDS + 1);
    expect(path).toEqual([{ x: 0, y: 500, t: TRAIL_SECONDS + 1 }]);
    expect(pathShows(path, TRAIL_SECONDS + 2)).toBe(true);
    expect(pathShows(path, 2 * TRAIL_SECONDS + 1)).toBe(false);
  });

  it('reaches a box within the ink of a live mark', () => {
    const box = { left: 100, top: 100, right: 200, bottom: 200 };
    const path = [{ x: 100 - TRAIL_RADIUS_PX + 5, y: 150, t: 0 }];
    expect(inkReaches(path, box, 1)).toBe(true);
    expect(inkReaches(path, box, TRAIL_SECONDS)).toBe(false);
    expect(
      inkReaches([{ x: 100 - TRAIL_RADIUS_PX - 5, y: 150, t: 0 }], box, 1),
    ).toBe(false);
  });
});
