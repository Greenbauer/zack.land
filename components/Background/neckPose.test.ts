import { describe, expect, it } from 'vitest';

import { FAR_TURN, FULL_NOD, FULL_TURN, neckExpressions } from './neckPose';

describe("the neck's shapes as the head turns", () => {
  it('shows none facing straight ahead', () => {
    for (const strength of Object.values(neckExpressions({ x: 0, y: 0 })))
      expect(strength).toBe(0);
  });

  it('stands the far muscle out in proportion to the turn, one side at a time', () => {
    const half = neckExpressions({ x: 0, y: -FULL_TURN / 2 });
    expect(half.neckTurnRight).toBeCloseTo(0.5);
    expect(half.neckTurnLeft).toBe(0);
    expect(neckExpressions({ x: 0, y: FULL_TURN * 2 }).neckTurnLeft).toBe(1);
  });

  it('goes on to the far turn past the full one, the full shape held', () => {
    expect(neckExpressions({ x: 0, y: -FULL_TURN }).neckTurnRightFar).toBe(0);
    const between = neckExpressions({ x: 0, y: -(FULL_TURN + FAR_TURN) / 2 });
    expect(between.neckTurnRight).toBe(1);
    expect(between.neckTurnRightFar).toBeCloseTo(0.5);
    expect(between.neckTurnLeftFar).toBe(0);
    expect(neckExpressions({ x: 0, y: FAR_TURN }).neckTurnLeftFar).toBe(1);
  });

  it('bunches under the chin nodding down and stretches the throat tipped back', () => {
    expect(neckExpressions({ x: FULL_NOD, y: 0 })).toMatchObject({
      neckDown: 1,
      neckUp: 0,
    });
    expect(neckExpressions({ x: -FULL_NOD / 4, y: 0 }).neckUp).toBeCloseTo(
      0.25,
    );
  });
});
