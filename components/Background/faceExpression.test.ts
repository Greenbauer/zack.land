import { describe, expect, it } from 'vitest';

import {
  easeToward,
  FACING_SMILE,
  facingSmile,
  pointerExpressions,
  SQUINT_MAX,
} from './faceExpression';

const size = { width: 1600, height: 900 };
// The head sits on the left of the page; its eyes about here.
const eyes = { x: 420, y: 420 };

describe('expressions from where the head is looking', () => {
  it('stays neutral looking at something close to the eyes and level with them', () => {
    expect(pointerExpressions({ x: 500, y: 430 }, eyes, size)).toEqual({
      browsUp: 0,
      squint: 0,
    });
  });

  it('raises the brows when the spot is above the eyes, more the higher', () => {
    const little = pointerExpressions({ x: 420, y: 300 }, eyes, size).browsUp;
    const more = pointerExpressions({ x: 420, y: 100 }, eyes, size).browsUp;
    expect(little).toBeGreaterThan(0);
    expect(more).toBeGreaterThan(little);
    expect(pointerExpressions({ x: 420, y: 700 }, eyes, size).browsUp).toBe(0);
  });

  it('squints at something on the far side of the screen, not nearby', () => {
    expect(pointerExpressions({ x: 1580, y: 420 }, eyes, size).squint).toBe(
      SQUINT_MAX,
    );
    expect(SQUINT_MAX).toBeLessThanOrEqual(0.5);
    expect(pointerExpressions({ x: 800, y: 420 }, eyes, size).squint).toBe(0);
  });

  it('counts a spot off the screen as its nearest edge', () => {
    expect(pointerExpressions({ x: 9000, y: -9000 }, eyes, size)).toEqual(
      pointerExpressions({ x: 1600, y: 0 }, eyes, size),
    );
  });

  it('eases toward the target without jumping or overshooting', () => {
    let s = 0;
    for (let frame = 0; frame < 60; frame++) {
      const next = easeToward(s, 1, 1 / 60);
      expect(next - s).toBeLessThan(0.1);
      expect(next).toBeLessThanOrEqual(1);
      s = next;
    }
    expect(s).toBeGreaterThan(0.9);
  });

  it('smiles faintly facing the camera, and not when turned away', () => {
    expect(facingSmile({ x: 0, y: 0 })).toBe(FACING_SMILE);
    expect(FACING_SMILE).toBeLessThan(0.4);
    expect(facingSmile({ x: 0.02, y: 0.03 })).toBe(FACING_SMILE);
    expect(facingSmile({ x: 0, y: -0.3 })).toBe(0);
    expect(facingSmile({ x: -0.15, y: 0 })).toBe(0);
  });
});
