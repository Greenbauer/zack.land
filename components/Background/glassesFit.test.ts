import { BufferGeometry, Float32BufferAttribute } from 'three';
import { describe, expect, it } from 'vitest';

import { armFit, wrapArm } from './glassesFit';

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

  it('moves an arm outward along its length, the hinge staying put', () => {
    const arm = (side: 1 | -1) => {
      const g = new BufferGeometry();
      g.setAttribute(
        'position',
        new Float32BufferAttribute(
          [10 * side, 0, 0, 10 * side, 0, -12, 10 * side, 1, -40],
          3,
        ),
      );
      const fit = Array.from({ length: 25 }, (_, k) => k / 4);
      return wrapArm(g, { x: 10 * side, z: 0 }, side, -24, fit);
    };
    const left = arm(1).getAttribute('position');
    expect(left.getX(0)).toBeCloseTo(10);
    // Half way along: half the full push. Behind the fit: the full push.
    expect(left.getX(1)).toBeCloseTo(13);
    expect(left.getX(2)).toBeCloseTo(16);
    expect(left.getZ(1)).toBeCloseTo(-12);
    const right = arm(-1).getAttribute('position');
    expect(right.getX(1)).toBeCloseTo(-13);
  });
});
