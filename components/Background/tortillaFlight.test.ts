import { describe, expect, it } from 'vitest';

import {
  FACE,
  FLIGHTS,
  HITS,
  LANDS,
  LETS_GO,
  OFF_SCREEN,
  tortillaAt,
} from './tortillaFlight';

describe('the tortillas thrown for Texas Tech', () => {
  it('cross from off one side of the screen to off the other', () => {
    for (const flight of FLIGHTS.filter((f) => !f.hits)) {
      const [start, end] = [tortillaAt(flight, 0), tortillaAt(flight, 1)];
      expect(Math.abs(start.x)).toBe(OFF_SCREEN);
      expect(Math.abs(end.x)).toBe(OFF_SCREEN);
      expect(Math.sign(start.x)).toBe(-Math.sign(end.x));
      // One arc: it comes back to the height it was thrown from.
      expect(end.y).toBeCloseTo(start.y);
      // In front of the face clear of the nose, or behind the head.
      expect(flight.depth > 70 || flight.depth < -70).toBe(true);
    }
  });

  it('throws some at the face: in from off screen, stuck, then slid away', () => {
    const hits = FLIGHTS.filter((f) => f.hits);
    expect(hits).toHaveLength(HITS);
    for (const flight of hits) {
      expect(Math.abs(tortillaAt(flight, 0).x)).toBe(OFF_SCREEN);
      const landed = tortillaAt(flight, (LANDS + LETS_GO) / 2);
      expect(landed).toEqual({ x: 0, ...FACE, stuck: true });
      // Gone well below the head by the end of its loop.
      expect(tortillaAt(flight, 1).y).toBeLessThan(-250);
    }
  });
});
