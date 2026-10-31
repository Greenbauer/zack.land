import { describe, expect, it } from 'vitest';

import {
  easeLine,
  measuresRest,
  MELT_IN_S,
  MELT_OUT_S,
  paceOf,
  restingBox,
  squareSide,
  stepMelt,
  stirOf,
  streakLine,
} from './mediaMelter';

describe("a tile's melt", () => {
  it('goes from nothing to whole and back, and no further', () => {
    expect(stepMelt(0, 1, MELT_IN_S)).toBe(1);
    expect(stepMelt(1, -1, MELT_OUT_S)).toBe(0);
    expect(stepMelt(1, 1, 0.1)).toBe(1);
    expect(stepMelt(0, -1, 0.1)).toBe(0);
  });

  it('turns back from wherever it has got to', () => {
    const halfWay = stepMelt(0, 1, MELT_IN_S / 2);
    expect(halfWay).toBeCloseTo(0.5, 5);
    expect(stepMelt(halfWay, -1, MELT_OUT_S / 4)).toBeCloseTo(0.25, 5);
  });
});

describe('how a turn mixes', () => {
  it('stirs only while both are there', () => {
    expect(stirOf(0, 0.5)).toBe(0);
    expect(stirOf(0.5, 0)).toBe(0);
    expect(stirOf(0.5, 0.5)).toBe(1);
    expect(stirOf(0, 1)).toBe(0);
  });
});

describe('the streak of a turn', () => {
  it('runs through the middle of every picture going or coming', () => {
    const box = (y: number, height: number) => ({
      x: 0,
      y,
      width: 100,
      height,
    });
    expect(streakLine([box(100, 200)])).toBe(200);
    expect(streakLine([box(100, 100), box(300, 100)])).toBe(250);
    expect(streakLine([])).toBe(0);
  });
});

describe('how fast a tile melts', () => {
  it('varies either way coming in', () => {
    expect(paceOf(1, 0)).toBeLessThan(1);
    expect(paceOf(1, 1)).toBeGreaterThan(1);
  });

  it('is never slow going out, so none is left behind', () => {
    expect(paceOf(-1, 0)).toBeGreaterThan(1);
    expect(paceOf(-1, 1)).toBeGreaterThan(paceOf(-1, 0));
  });
});

describe("the streak's line", () => {
  it('follows the pictures rather than jumping to them', () => {
    expect(easeLine(100, 100, 0.016)).toBe(100);
    expect(easeLine(100, 200, 0)).toBe(100);
    const soon = easeLine(100, 200, 0.016);
    expect(soon).toBeGreaterThan(100);
    expect(soon).toBeLessThan(110);
    expect(easeLine(100, 200, 5)).toBeCloseTo(200, 3);
  });
});

describe('a still picture on the canvas', () => {
  it('sits on sides of a power of two, capped', () => {
    expect(squareSide(600)).toBe(1024);
    expect(squareSide(1024)).toBe(1024);
    expect(squareSide(5000)).toBe(2048);
  });
});

describe('reading where a tile rests', () => {
  const rest = { x: 10, y: 20, width: 30, height: 40 };

  it('follows a tile coming in, whose card can still be moving', () => {
    expect(measuresRest(1, rest)).toBe(true);
  });

  it('holds still once a tile is going, however its card moves', () => {
    expect(measuresRest(-1, null)).toBe(true);
    expect(measuresRest(-1, rest)).toBe(false);
  });
});

describe('where a melting tile rests', () => {
  const tile = { x: 30, y: 40, width: 200, height: 100 };

  it('is the same however far the page has scrolled', () => {
    const at = (scroll: number) =>
      restingBox(
        { left: 500, top: 160 - scroll + 12 },
        { top: 160 - scroll },
        160,
        tile,
      );
    expect(at(0)).toEqual({ x: 530, y: 212, width: 200, height: 100 });
    expect(at(300)).toEqual(at(0));
    expect(at(-450)).toEqual(at(0));
  });
});
