import { Euler, Matrix4, Vector3 } from 'three';
import { describe, expect, it } from 'vitest';

import { forecastTurn, setSkyRotation, skyTurn } from './Sky';

// MyHead's pointer units for a pointer at (x, y) on a screen of this size.
const size = { width: 1200, height: 800 };
const target = (x: number, y: number) => ({
  x: (x - size.width / 3) * 0.5,
  y: (y - size.height / 2) * 0.5,
});

describe('the sky turning with the head', () => {
  it('turns 180° from one edge of the screen to the other', () => {
    expect(skyTurn(target(0, 400), size).y).toBeCloseTo(-Math.PI / 2);
    expect(skyTurn(target(1200, 400), size).y).toBeCloseTo(Math.PI / 2);
    expect(skyTurn(target(600, 0), size).x).toBeCloseTo(-Math.PI / 2);
    expect(skyTurn(target(600, 800), size).x).toBeCloseTo(Math.PI / 2);
  });

  it('is level with the pointer at the middle of the screen', () => {
    const turn = skyTurn(target(600, 400), size);
    expect(turn.x).toBeCloseTo(0);
    expect(turn.y).toBeCloseTo(0);
  });

  it('turns no further when an idle look aims past the edges', () => {
    // MyHead's wandering picks targets as far as -2000 pointer units.
    expect(skyTurn({ x: -2000, y: -600 }, size)).toEqual({
      x: -Math.PI / 2,
      y: -Math.PI / 2,
    });
  });

  it('keeps the horizon level while turning, tipping it only up and down', () => {
    // three turns the sky by the rotation's matrix, so the sky's up direction
    // as the camera sees it is that matrix applied to straight up. A level
    // horizon leaves it no sideways part.
    const rotation = new Euler();
    for (const [x, y] of [
      [0.6, 1.2],
      [-1.2, -1.4],
      [1.5, 0.4],
    ] as const) {
      setSkyRotation(rotation, { x, y });
      const up = new Vector3(0, 1, 0).applyMatrix4(
        new Matrix4().makeRotationFromEuler(rotation),
      );
      expect(up.x).toBeCloseTo(0);
      expect(Math.atan2(up.z, up.y)).toBeCloseTo(x);
    }
  });
});

describe('the sky forecast', () => {
  const now = {
    turn: { x: 0, y: 0 },
    aim: { x: 1, y: -1 },
    drift: { x: 0, y: 0 },
    speed: 0.05,
    rate: 0,
  };

  it('eases toward the aim as the sky does, frame by frame', () => {
    const ahead = forecastTurn(now, 20);
    // Twenty frames of easing 5% of the way each: 1 - 0.95^20 of the way.
    expect(ahead.x).toBeCloseTo(1 - 0.95 ** 20);
    expect(ahead.y).toBeCloseTo(-(1 - 0.95 ** 20));
    expect(forecastTurn(now, 0)).toEqual(now.turn);
  });

  it('carries a moving aim on, as far as the sky reaches', () => {
    const drifting = { ...now, drift: { x: 0.05, y: 0 } };
    expect(forecastTurn(drifting, 20).x).toBeGreaterThan(
      forecastTurn(now, 20).x,
    );
    const far = forecastTurn(
      { ...drifting, aim: { x: Math.PI / 2, y: 0 }, speed: 1 },
      10,
    );
    expect(far.x).toBeCloseTo(Math.PI / 2);
  });

  it('stays put while the sky is still', () => {
    const still = { ...now, speed: 0, turn: { x: 0.3, y: -0.2 } };
    expect(forecastTurn(still, 30)).toEqual(still.turn);
  });
});
