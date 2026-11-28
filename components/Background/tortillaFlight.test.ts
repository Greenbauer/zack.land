import { describe, expect, it } from 'vitest';

import {
  AZIMUTHS,
  flyerAt,
  FLYERS,
  THROW_SECONDS,
  throwAt,
  THROWS,
  TORTILLA_RADIUS,
} from './tortillaFlight';

describe('the tortillas of Texas Tech', () => {
  it('always has some crossing, each clear across the window behind the head', () => {
    let some = 0;
    for (let t = 0; t < 120; t += 0.5) {
      const flying = Array.from({ length: FLYERS }, (_, k) => flyerAt(k, t));
      if (flying.some(Boolean)) some++;
      for (const at of flying)
        if (at) expect(at.z).toBeLessThan(-TORTILLA_RADIUS * 2);
    }
    expect(some).toBe(240);
    for (let k = 0; k < FLYERS; k++) {
      const xs: number[] = [];
      for (let t = 0; t < 30; t += 0.02) {
        const at = flyerAt(k, t);
        if (at) xs.push(at.x);
      }
      expect(Math.min(...xs)).toBeLessThan(-500);
      expect(Math.max(...xs)).toBeGreaterThan(500);
    }
  });

  it('throws none at the head at first, and then one only now and then', () => {
    for (let t = 0; t < 5; t += 0.1) expect(throwAt(t)).toBeNull();
    THROWS.slice(1).forEach((thrown, k) =>
      expect(thrown.at - THROWS[k]!.at).toBeGreaterThan(THROW_SECONDS),
    );
    expect(throwAt(THROWS[0]!.at + 1)?.thrown).toBe(THROWS[0]);
  });

  it('never throws the same way twice running, always at the sides', () => {
    THROWS.slice(1).forEach((thrown, k) => {
      const last = THROWS[k]!;
      expect(thrown.azimuth).not.toBe(last.azimuth);
      const sameSide = AZIMUTHS[thrown.azimuth]! * AZIMUTHS[last.azimuth]! > 0;
      if (sameSide) expect(thrown.kind).not.toBe(last.kind);
    });
    for (const azimuth of AZIMUTHS)
      expect(Math.abs(azimuth)).toBeGreaterThan(Math.PI / 4);
    // All the ways it can go come up.
    const soon = THROWS.slice(0, 12);
    expect(new Set(soon.map((thrown) => thrown.kind)).size).toBe(2);
    expect(new Set(soon.map((thrown) => thrown.azimuth)).size).toBeGreaterThan(
      3,
    );
  });

  it('is as big as a real tortilla: wider than the face', () => {
    expect(TORTILLA_RADIUS * 2).toBeGreaterThan(84);
  });
});
