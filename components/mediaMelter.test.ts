import { describe, expect, it } from 'vitest';

import {
  easeMelt,
  MELT_IN_S,
  MELT_OUT_S,
  restingBox,
  stepMelt,
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

  it('draws nothing at the start and the picture at the end, easing to a stop', () => {
    expect(easeMelt(0)).toBe(0);
    expect(easeMelt(1)).toBe(1);
    expect(easeMelt(0.9) - easeMelt(0.8)).toBeLessThan(
      easeMelt(0.2) - easeMelt(0.1),
    );
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
