import { describe, expect, it } from 'vitest';

import { armFit, fitScale } from './glassesFit';

const hinge = { x: 10, z: 0 };
const band = { low: -1, high: 1, back: -24 };

describe("fitting a pair of glasses' arms round a head", () => {
  it('leaves an arm where it is when the head is inside it', () => {
    const fit = armFit([8, 0, -10, 9.5, 0, -15], hinge, 1, band, 0.2);
    expect(fit).toHaveLength(25);
    expect(Math.max(...fit)).toBe(0);
  });

  it('pushes it out by what the head needs, with the gap, from there back', () => {
    // A point 2 outside the hinge, 10 behind it, and a gap of 1.
    const fit = armFit([12, 0, -10], hinge, 1, band, 1);
    expect(fit[0]).toBe(0);
    expect(fit[8]).toBe(0);
    expect(fit[10]).toBeGreaterThanOrEqual(3);
    // It never dips in again behind the widest point.
    for (let k = 11; k < fit.length; k++)
      expect(fit[k]).toBeGreaterThanOrEqual(fit[k - 1]!);
    expect(fit[24]).toBe(3);
  });

  it('counts only the head beside the arm: its heights, its length, its side', () => {
    const outside = [
      [30, 5, -10], // above the arm
      [30, 0, 5], // in front of the hinge
      [30, 0, -30], // behind the arm
      [-30, 0, -10], // the other side of the head
    ].flat();
    expect(Math.max(...armFit(outside, hinge, 1, band, 0.2))).toBe(0);
  });

  it('fits the other arm the other way', () => {
    const fit = armFit([-12, 0, -10], { x: -10, z: 0 }, -1, band, 1);
    expect(fit[24]).toBe(3);
  });

  it('scales a pair up just until its arms clear the head, never bending them', () => {
    // A head 20 wide beside an arm at 8 times the scale, clear once 8s > 10.
    const clears = (scale: number) =>
      Math.max(...armFit([10, 0, -10], { x: 8 * scale, z: 0 }, 1, band, 0)) ===
      0;
    expect(fitScale(clears, 1, 2)).toBeCloseTo(1.25, 2);
    // Already clear at the smallest: kept there.
    expect(fitScale(clears, 1.5, 2)).toBe(1.5);
    // Never clear: the largest.
    expect(fitScale(() => false, 1, 2)).toBe(2);
  });
});
