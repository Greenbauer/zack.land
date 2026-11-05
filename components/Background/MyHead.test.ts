import { describe, expect, it } from 'vitest';

import { BODY_TURN, splitLook } from './MyHead';
import { FAR_TURN } from './neckPose';
import { WANDER_TURN } from './wander';

describe('the head and body turn', () => {
  it('keeps the shoulders still, turned in toward the middle of the page', () => {
    for (const look of [
      { x: 0, y: 0 },
      { x: -0.15, y: -0.5 },
      { x: 0.13, y: 0.3 },
    ])
      expect(splitLook(look).body).toEqual({ x: 0, y: BODY_TURN });
    // Toward the page's middle: the head sits left of it, so the chest turns
    // right (a positive turn about the vertical).
    expect(BODY_TURN).toBeGreaterThan(0.1);
  });

  it('turns the head on the neck so it still looks where the pointer is', () => {
    const look = { x: 0.1, y: -0.4 };
    const { body, head } = splitLook(look);
    expect(body.y + head.y).toBeCloseTo(look.y);
    expect(head.x).toBe(look.x);
  });

  it('never turns the head on the neck past its far shapes', () => {
    expect(-splitLook({ x: 0, y: WANDER_TURN[0] }).head.y).toBeLessThan(
      FAR_TURN,
    );
  });
});
