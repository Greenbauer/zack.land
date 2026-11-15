import { Euler, Matrix4, Vector3 } from 'three';
import { describe, expect, it } from 'vitest';

import { lookAt } from './headLook';
import { framedHead, glide, GLIDE_SECONDS, lookOrigin } from './headPlace';
import {
  forecastTurn,
  holdAtHome,
  setSkyRotation,
  skyPointer,
  skySpeed,
  stepSky,
} from './Sky';

// The look target (headLook.ts) for a pointer at (x, y) on a screen of this
// size, as the head makes it, looking out from `origin` across; and the
// sky's turn for it, read from the same place.
const size = { width: 1200, height: 800 };
const target = (x: number, y: number, origin = size.width / 3) =>
  lookAt({ x, y }, { x: origin, y: size.height / 2 });
const turnFor = (x: number, y: number, origin = size.width / 3) =>
  skyPointer(target(x, y, origin), size, origin);

describe('the sky turning with the head', () => {
  it('turns its full reach either way from one edge of the screen to the other', () => {
    expect(turnFor(0, 400).y).toBeCloseTo(-1);
    expect(turnFor(1200, 400).y).toBeCloseTo(1);
    expect(turnFor(600, 0).x).toBeCloseTo(-1);
    expect(turnFor(600, 800).x).toBeCloseTo(1);
  });

  it('is level with the pointer at the middle of the screen', () => {
    const turn = turnFor(600, 400);
    expect(turn.x).toBeCloseTo(0);
    expect(turn.y).toBeCloseTo(0);
  });

  // Audit B10: the head looks out from lookOrigin, which moves with the head
  // (headPlace.ts), and the sky read the pointer from a third of the way
  // across, so with the head in the middle of the screen the pointer at the
  // middle turned the sky half its reach to the left.
  it('finds the pointer where it is, wherever the head sits', () => {
    const before = framedHead.x;
    try {
      for (const headX of [size.width / 4, size.width / 2, 900]) {
        framedHead.x = headX;
        const origin = lookOrigin(size.width);
        expect(turnFor(600, 400, origin).y).toBeCloseTo(0);
        expect(turnFor(0, 400, origin).y).toBeCloseTo(-1);
        expect(turnFor(1200, 400, origin).y).toBeCloseTo(1);
        expect(turnFor(300, 400, origin).y).toBeCloseTo(-0.5);
      }
    } finally {
      framedHead.x = before;
    }
  });

  it('read from a third of the way across, misplaced the pointer', () => {
    // What the sky did before B10's fix, with the head in the middle.
    const origin = size.width / 2 + size.width / 12;
    const misread = skyPointer(target(600, 400, origin), size, size.width / 3);
    expect(misread.y).toBeCloseTo(-0.5);
  });

  it('turns no further when an idle look aims past the edges', () => {
    // The head's wandering picks targets as far as -2000 look units.
    expect(skyPointer({ x: -2000, y: -600 }, size, size.width / 3)).toEqual({
      x: -1,
      y: -1,
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

describe('the sky moving to another view', () => {
  // A new home `way` radians off, followed frame by frame at 60 frames a
  // second by a sky easing at `headSpeed`; the sky's turn each frame.
  const path = (way: number, headSpeed: number) => {
    let home = { x: 0, speed: 0 };
    let turn = 0;
    return Array.from({ length: 120 }, () => {
      home = glide(home, way, 1 / 60);
      turn += skySpeed(Math.abs(way - home.x), headSpeed) * (home.x - turn);
      return turn;
    });
  };

  it('is under way within a tenth of a second', () => {
    for (const headSpeed of [0.01, 0.05])
      expect(path(4, headSpeed)[5]).toBeGreaterThan(0.1);
  });

  it('gets there in about the head’s glide, even as the head wanders', () => {
    const arrival = Math.round((GLIDE_SECONDS + 0.3) * 60);
    for (const headSpeed of [0.01, 0.05])
      expect(path(4, headSpeed)[arrival]).toBeGreaterThan(4 * 0.95);
  });

  it('never overshoots its home', () => {
    expect(Math.max(...path(4, 1))).toBeLessThanOrEqual(4);
  });

  it('keeps the head’s own easing once home', () => {
    expect(skySpeed(0.01, 0.05)).toBe(0.05);
    expect(skySpeed(1, 1)).toBe(1);
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

// Finding A7 (docs/audit/2026-11.md): with reduced motion the sky does not
// glide from one view's resting place to the next; it is there at once.
describe('the sky with reduced motion', () => {
  it("reaches a new view's resting place in one frame, from anywhere", () => {
    const viewHome = { x: 0.8, y: -1.57 };
    for (const from of [
      { x: -0.8, y: 2.36 },
      { x: 0, y: 0 },
      { x: 1.2, y: -3 },
    ]) {
      const home = { ...from, speed: { x: 0.4, y: -0.2 } };
      const turn = { ...from };
      holdAtHome(home, turn, viewHome);
      expect(turn).toEqual(viewHome);
      expect(home).toEqual({ ...viewHome, speed: { x: 0, y: 0 } });
    }
  });

  it('where with motion one frame goes only part of the way', () => {
    const step = glide({ x: -0.8, speed: 0 }, 0.8, 1 / 60, GLIDE_SECONDS);
    expect(step.x).toBeLessThan(-0.7);
  });
});

// Audit B4: the sky eased a share of the way each frame, so on a 120 Hz
// screen it moved about twice as fast as the head, which eases by time.
describe('the sky at any frame rate', () => {
  // The sky after a second at `hz` frames a second, easing at `speed` after
  // an aim moving `pace` radians a second from 1.
  const after = (hz: number, speed: number, pace = 0) => {
    const now = {
      turn: { x: 0, y: 0 },
      aim: { x: 1, y: 0 },
      drift: { x: pace / 60, y: 0 },
      speed,
      rate: 0,
    };
    for (let frame = 1; frame <= hz; frame++)
      stepSky(now, { x: 1 + (pace * frame) / hz, y: 0 }, speed, 1 / hz);
    return now;
  };

  it('turns as far in a second at 120 frames a second as at 60', () => {
    for (const speed of [0.01, 0.05, 0.3]) {
      expect(after(120, speed).turn.x).toBeCloseTo(after(60, speed).turn.x);
      expect(after(144, speed).turn.x).toBeCloseTo(after(60, speed).turn.x);
    }
  });

  it('at 60 frames a second, moves as it always did', () => {
    // `speed` of the way each frame: 1 - (1 - speed)^60 of it in a second.
    expect(after(60, 0.05).turn.x).toBeCloseTo(1 - 0.95 ** 60);
  });

  it('reports the same turning speed and drift at any frame rate', () => {
    const slow = after(60, 0.05, 0.6);
    const fast = after(120, 0.05, 0.6);
    expect(fast.rate).toBeCloseTo(slow.rate, 4);
    expect(fast.drift.x).toBeCloseTo(slow.drift.x, 4);
    // The aim moving 0.6 a second is 0.01 each 60th of a second.
    expect(slow.drift.x).toBeCloseTo(0.01, 4);
  });
});
