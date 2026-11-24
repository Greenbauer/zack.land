import { BufferGeometry, Float32BufferAttribute } from 'three';
import { describe, expect, it } from 'vitest';

import {
  earTop,
  flexAmount,
  flexArm,
  flexShape,
  noseBridge,
  templeWidth,
} from './glassesFit';

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

  it('flexes an arm as a beam bends: none at the hinge, most at the end', () => {
    expect(flexShape(0)).toBe(0);
    expect(flexShape(1)).toBe(1);
    expect(flexShape(0.5)).toBeLessThan(0.5);
    for (let t = 0.1; t <= 1; t += 0.1)
      expect(flexShape(t)).toBeGreaterThan(flexShape(t - 0.1));
  });

  it('flexes an arm just enough to clear the head beside it, not for the ear below', () => {
    // An arm along x = 40 from the hinge back 60, between heights 0 and 2.
    const arm = [40, 0, 0, 40, 0, -60, 40, 2, -30];
    const hinge = { x: 40, z: 0 };
    // Clear of the head: no flex.
    expect(flexAmount([30, 1, -20], arm, hinge, 1, 1)).toBe(0);
    // The skull 5 out past it 40 back: flexed so it clears there.
    const amount = flexAmount([45, 1, -40], arm, hinge, 1, 1);
    expect(40 + amount * flexShape(40 / 60)).toBeGreaterThanOrEqual(46 - 0.3);
    // An ear below the arm's height does not push it.
    expect(flexAmount([45, -10, -40], arm, hinge, 1, 1)).toBe(0);
    // The other side, the other way.
    const mirror = [-40, 0, 0, -40, 0, -60, -40, 2, -30];
    expect(
      flexAmount([-45, 1, -40], mirror, { x: -40, z: 0 }, -1, 1),
    ).toBeCloseTo(amount);
  });

  it('bends the arm outward, the hinge staying put', () => {
    const g = new BufferGeometry();
    g.setAttribute(
      'position',
      new Float32BufferAttribute([40, 0, 0, 40, 0, -60, 40, 5, -30], 3),
    );
    const p = flexArm(g, { x: 40, z: 0 }, 1, 8, 60).getAttribute('position');
    expect(p.getX(0)).toBeCloseTo(40);
    expect(p.getX(1)).toBeCloseTo(48);
    expect(p.getX(2)).toBeCloseTo(40 + 8 * flexShape(0.5));
    expect(p.getZ(1)).toBe(-60);
    expect(p.getY(2)).toBe(5);
  });

  it('finds the tops of the ears: the highest point standing out past the skull', () => {
    // x, y, z: an ear's top and lobe, the skull above, and a point in front.
    const head = [50, 5, -20, 50, -20, -20, 40, 30, -20, 52, 12, 30];
    expect(earTop(head, { beyond: 45, back: -40, front: 0, high: 20 })).toBe(5);
  });
});
