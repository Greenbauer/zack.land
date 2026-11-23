import { BufferGeometry, Float32BufferAttribute } from 'three';
import { describe, expect, it } from 'vitest';

import { noseBridge, openAngle, swingArm, templeWidth } from './glassesFit';

describe('fitting a pair of glasses to a head, as a real pair fits', () => {
  it('measures the head across its temples, in its band only', () => {
    // x, y, z: two temple points, one an ear below the band, one behind it.
    const head = [-40, 5, 0, 38, 6, 0, 52, -10, 0, 60, 5, -50];
    expect(templeWidth(head, { low: 0, high: 10, back: -10, front: 10 })).toBe(
      80,
    );
  });

  it('finds the nose bridge: the frontmost point near the middle', () => {
    const head = [0, 2, 40, 1, 3, 41, 0, -20, 55, 20, 2, 50];
    expect(noseBridge(head, { low: 0, high: 10, reach: 3 })).toBe(41);
  });

  it('leaves an arm shut when the head is clear of it', () => {
    // An arm along x = 40, from the hinge back 60; the head inside, at 30.
    const arm = [40, 0, 0, 40, 0, -60, 40, 2, -30];
    const head = [30, 1, -20, 35, 1, -50];
    expect(openAngle(head, arm, { x: 40, z: 0 }, 1, 1)).toBe(0);
  });

  it('opens an arm just enough to clear the head beside it', () => {
    const arm = [40, 0, 0, 40, 0, -60, 40, 2, -30];
    // The head 5 out past the arm, 40 back: about atan(6 / 40) with the gap.
    const head = [45, 1, -40];
    const angle = openAngle(head, arm, { x: 40, z: 0 }, 1, 1);
    expect(angle).toBeGreaterThan(Math.atan(6 / 40) - 0.01);
    expect(angle).toBeLessThan(Math.atan(6 / 40) + 0.02);
    // Not the ear the hook behind the straight part rests on.
    expect(openAngle([45, 1, -55], arm, { x: 40, z: 0 }, 1, 1)).toBe(0);
    // Only the head beside the arm, between its heights, counts.
    expect(openAngle([45, 9, -40], arm, { x: 40, z: 0 }, 1, 1)).toBe(0);
    // The other side, the other way.
    const mirror = [-40, 0, 0, -40, 0, -60, -40, 2, -30];
    expect(openAngle([-45, 1, -40], mirror, { x: -40, z: 0 }, -1, 1)).toBe(
      angle,
    );
  });

  it('swings an arm whole about its hinge, never reshaping it', () => {
    const g = new BufferGeometry();
    g.setAttribute(
      'position',
      new Float32BufferAttribute([40, 0, 0, 40, 0, -60, 40, 5, -30], 3),
    );
    const p = swingArm(g, { x: 40, z: 0 }, 1, Math.PI / 6).getAttribute(
      'position',
    );
    // The hinge stays put; the end swings out, as far from it as before.
    expect(p.getX(0)).toBeCloseTo(40);
    expect(p.getZ(0)).toBeCloseTo(0);
    expect(p.getX(1)).toBeCloseTo(40 + 60 * Math.sin(Math.PI / 6));
    expect(p.getZ(1)).toBeCloseTo(-60 * Math.cos(Math.PI / 6));
    expect(Math.hypot(p.getX(1) - 40, p.getZ(1))).toBeCloseTo(60);
    expect(p.getY(2)).toBe(5);
  });
});
