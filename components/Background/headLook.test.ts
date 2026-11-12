import { describe, expect, it } from 'vitest';

import {
  BODY_TURN,
  gazeTarget,
  lookAt,
  lookOnScreen,
  lookToRadians,
  splitLook,
} from './headLook';
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

describe('look targets', () => {
  const origin = { x: 400, y: 300 };

  it('measure the pointer from where the head looks out, at half a unit a pixel', () => {
    expect(lookAt(origin, origin)).toEqual({ x: 0, y: 0 });
    expect(lookAt({ x: 600, y: 100 }, origin)).toEqual({ x: 100, y: -100 });
  });

  it('point back at the pixel they were measured from', () => {
    const pointer = { x: 123, y: 456 };
    expect(lookOnScreen(lookAt(pointer, origin), origin)).toEqual(pointer);
  });

  it('turn the head a thousandth of a radian a unit', () => {
    expect(lookToRadians(250)).toBeCloseTo(0.25);
  });

  it('take a gaze tipping down and turning right to a target below and right', () => {
    const target = gazeTarget({ x: 0.1, y: 0.3 });
    expect(target.x).toBeCloseTo(300);
    expect(target.y).toBeCloseTo(100);
    expect(lookToRadians(target.x)).toBeCloseTo(0.3);
  });
});
