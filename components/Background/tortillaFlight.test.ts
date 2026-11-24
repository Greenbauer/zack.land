import { describe, expect, it } from 'vitest';

import {
  HIT_PHASE,
  HIT_SECONDS,
  HIT_SIDE,
  LANDS,
  LETS_GO,
  OFF_SCREEN,
  TORTILLA_RADIUS,
  tortillaAt,
} from './tortillaFlight';

describe('the tortilla thrown for Texas Tech', () => {
  // Where it is `t` seconds into the chapter.
  const at = (t: number) =>
    tortillaAt((((t / HIT_SECONDS + HIT_PHASE) % 1) + 1) % 1);

  it('hits only now and then: once a loop of several seconds, first a few seconds in', () => {
    expect(HIT_SECONDS).toBeGreaterThanOrEqual(6);
    expect(at(0).drape).toBe(0);
    expect(at(3.5).drape).toBe(1);
  });

  it('comes in from off the screen at the side, not the front', () => {
    const start = tortillaAt(0.06);
    expect(Math.abs(start.x)).toBeGreaterThan(OFF_SCREEN * 0.9);
    expect(Math.sign(start.x)).toBe(HIT_SIDE);
  });

  it('lies on the side of the head while it clings, sliding down, then drops away', () => {
    const early = tortillaAt(LANDS + 0.05);
    const late = tortillaAt(LETS_GO - 0.01);
    expect(early.drape).toBe(1);
    expect(late.up).toBeLessThan(early.up);
    expect(tortillaAt(0.85).y).toBeLessThan(-250);
  });

  it('is as big as a real tortilla: wider than the face', () => {
    expect(TORTILLA_RADIUS * 2).toBeGreaterThan(84);
  });
});
