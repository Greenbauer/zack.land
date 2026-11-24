import { describe, expect, it } from 'vitest';

import {
  FACE,
  FLIGHTS,
  HITS,
  LANDS,
  LETS_GO,
  OFF_SCREEN,
  TORTILLA_RADIUS,
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
      // Behind the head, clear of it at a real tortilla's size.
      expect(flight.depth).toBeLessThan(-TORTILLA_RADIUS * 2);
    }
  });

  it('throws some at the face: in from off screen, splatted on it, then dropped', () => {
    const hits = FLIGHTS.filter((f) => f.hits);
    expect(hits).toHaveLength(HITS);
    for (const flight of hits) {
      const start = tortillaAt(flight, 0);
      expect(Math.abs(start.x)).toBe(OFF_SCREEN);
      expect(start.drape).toBe(0);
      // Lying wholly on the face while it clings, sliding down it.
      const early = tortillaAt(flight, LANDS + 0.05);
      const late = tortillaAt(flight, LETS_GO - 0.01);
      expect(early.drape).toBe(1);
      expect(late.drape).toBe(1);
      expect(early.x).toBe(0);
      expect(late.y).toBeLessThan(early.y);
      expect(early.y).toBeLessThanOrEqual(FACE.y);
      // Peeled off and gone well below the head by the end of its loop.
      const end = tortillaAt(flight, 1);
      expect(end.drape).toBe(0);
      expect(end.y).toBeLessThan(-250);
    }
  });

  it('is as big as a real tortilla: wider than the face', () => {
    expect(TORTILLA_RADIUS * 2).toBeGreaterThan(84);
  });
});
