import { describe, expect, it } from 'vitest';

import {
  FLIGHTS,
  HIT_SIDE,
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

  it('throws one now and then at the side of the face: in from off screen, splatted on the cheek, then dropped', () => {
    const hits = FLIGHTS.filter((f) => f.hits);
    expect(hits).toHaveLength(1);
    const [flight] = hits as [(typeof FLIGHTS)[number]];
    // Once a loop of several seconds, its first hit a few seconds in.
    expect(flight.seconds).toBeGreaterThanOrEqual(6);
    const at = (t: number) =>
      tortillaAt(flight, (((t / flight.seconds + flight.phase) % 1) + 1) % 1);
    expect(at(0).drape).toBe(0);
    expect(at(3.5).drape).toBe(1);
    // In from off the screen's side, not from the front.
    const start = tortillaAt(flight, 0.06);
    expect(Math.abs(start.x)).toBeGreaterThan(OFF_SCREEN * 0.9);
    expect(Math.sign(start.x)).toBe(HIT_SIDE);
    // Lying on the cheek while it clings, sliding down it.
    const early = tortillaAt(flight, LANDS + 0.05);
    const late = tortillaAt(flight, LETS_GO - 0.01);
    expect(early.drape).toBe(1);
    expect(late.up).toBeLessThan(early.up);
    // Peeled off and gone well below the head.
    expect(tortillaAt(flight, 0.85).y).toBeLessThan(-250);
  });

  it('is as big as a real tortilla: wider than the face', () => {
    expect(TORTILLA_RADIUS * 2).toBeGreaterThan(84);
  });
});
