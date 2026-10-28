import { describe, expect, it } from 'vitest';

import {
  BACK_CHANCE,
  HOLD,
  nextLook,
  shownGaze,
  startWander,
  stepWander,
  TIP,
  TURN,
  Wander,
} from './wander';

// A repeatable random number generator (a linear congruential one).
const seeded = (seed: number) => () => {
  seed = (seed * 1664525 + 1013904223) % 4294967296;
  return seed / 4294967296;
};

// Twenty minutes of looking around at 60 frames a second, every frame.
function run(fps = 60, seconds = 1200, random = seeded(7)) {
  let wander = startWander({ x: 0, y: 0 }, 0, random);
  const frames: Wander[] = [];
  for (let k = 1; k <= fps * seconds; k++) {
    wander = stepWander(wander, k / fps, 1 / fps, random);
    frames.push(wander);
  }
  return frames;
}

describe('the head looking around on its own', () => {
  const frames = run();

  it('stays inside its turning range, never at its limits', () => {
    for (const { gaze } of frames) {
      expect(gaze.x).toBeGreaterThan(TIP[0]);
      expect(gaze.x).toBeLessThan(TIP[1]);
      expect(gaze.y).toBeGreaterThan(TURN[0]);
      expect(gaze.y).toBeLessThan(TURN[1]);
    }
  });

  it('turns mostly side to side', () => {
    const tips = frames.map(({ gaze }) => Math.abs(gaze.x));
    const turns = frames.map(({ gaze }) => Math.abs(gaze.y));
    const mean = (v: number[]) => v.reduce((a, b) => a + b) / v.length;
    expect(mean(turns)).toBeGreaterThan(2 * mean(tips));
  });

  it('moves smoothly: its speed never jumps between frames', () => {
    let biggest = 0;
    for (let k = 1; k < frames.length; k++) {
      const jump = Math.hypot(
        frames[k]!.speed.x - frames[k - 1]!.speed.x,
        frames[k]!.speed.y - frames[k - 1]!.speed.y,
      );
      biggest = Math.max(biggest, jump);
    }
    // A change of speed a frame of at most 0.3 radians a second.
    expect(biggest).toBeLessThan(0.3);
  });

  it('holds each look a while, the holds varied', () => {
    // Shifts happen where the target changes; the time between them.
    const shifts: number[] = [];
    frames.forEach((f, k) => {
      const prev = frames[k - 1];
      if (
        prev &&
        (f.target.x !== prev.target.x || f.target.y !== prev.target.y)
      )
        shifts.push(k / 60);
    });
    const gaps = shifts.slice(1).map((t, k) => t - shifts[k]!);
    expect(Math.min(...gaps)).toBeGreaterThanOrEqual(HOLD[0]);
    expect(Math.max(...gaps) - Math.min(...gaps)).toBeGreaterThan(2);
    // Roughly one shift every five to ten seconds over twenty minutes.
    expect(shifts.length).toBeGreaterThan(1200 / 10);
    expect(shifts.length).toBeLessThan(1200 / 5);
  });

  it('settles on each look before moving on', () => {
    frames.forEach((f, k) => {
      const next = frames[k + 1];
      if (
        next &&
        (next.target.x !== f.target.x || next.target.y !== f.target.y)
      )
        expect(
          Math.hypot(f.gaze.x - f.target.x, f.gaze.y - f.target.y),
        ).toBeLessThan(0.02);
    });
  });

  it('makes smaller shifts more often than big ones', () => {
    const random = seeded(3);
    let from = { x: 0, y: 0 };
    let small = 0;
    let big = 0;
    for (let k = 0; k < 4000; k++) {
      const { target } = nextLook(from, random);
      const size = Math.hypot(target.x - from.x, target.y - from.y);
      if (size < 0.3) small++;
      if (size > 0.55) big++;
      from = target;
    }
    expect(small).toBeGreaterThan(1.5 * big);
  });

  it('now and then glances back toward the camera', () => {
    const random = seeded(11);
    let from = { x: 0.1, y: -0.4 };
    let back = 0;
    for (let k = 0; k < 4000; k++) {
      const { target } = nextLook(from, random);
      if (Math.abs(target.x) < 0.035 && Math.abs(target.y) < 0.07) back++;
      from = target;
    }
    expect(back / 4000).toBeGreaterThan(BACK_CHANCE * 0.8);
  });

  it('looks around the same at any frame rate', () => {
    const at = (fps: number) => {
      const f = run(fps, 30, seeded(5));
      return f[f.length - 1]!.gaze;
    };
    const a = at(30);
    const b = at(144);
    expect(Math.hypot(a.x - b.x, a.y - b.y)).toBeLessThan(0.02);
  });

  it('is never quite still while holding a look', () => {
    const wander = frames[600]!;
    const a = shownGaze(wander, 10);
    const b = shownGaze(wander, 11);
    expect(Math.hypot(a.x - b.x, a.y - b.y)).toBeGreaterThan(0);
    expect(Math.hypot(a.x - wander.gaze.x, a.y - wander.gaze.y)).toBeLessThan(
      0.01,
    );
  });
});
