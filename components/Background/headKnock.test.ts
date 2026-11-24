import { afterEach, describe, expect, it } from 'vitest';

import { headKnock, knockAt } from './headKnock';

describe('the head knocked', () => {
  afterEach(() => {
    headKnock.at = -Infinity;
  });

  it('holds still when nothing has hit it', () => {
    expect(knockAt(100)).toEqual({ round: 0, tilt: 0 });
  });

  it('is knocked away from the side hit, and springs back to still', () => {
    for (const side of [1, -1]) {
      Object.assign(headKnock, { at: 10, side });
      expect(Math.sign(knockAt(10.1).round)).toBe(-side);
      expect(Math.sign(knockAt(10.1).tilt)).toBe(side);
      expect(Math.abs(knockAt(10.1).round)).toBeGreaterThan(0.05);
      expect(Math.abs(knockAt(11.5).round)).toBeLessThan(0.005);
      expect(knockAt(12.1)).toEqual({ round: 0, tilt: 0 });
    }
  });

  it('starts from still, with no jump', () => {
    Object.assign(headKnock, { at: 10, side: 1 });
    expect(Math.abs(knockAt(10.005).round)).toBeLessThan(0.015);
  });
});
