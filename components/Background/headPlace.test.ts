import { describe, expect, it } from 'vitest';

import { HEAD_REACH } from '@/components/collageLayout';

import {
  framedHead,
  glide,
  GLIDE_SECONDS,
  headCentre,
  lookOrigin,
} from './headPlace';

describe("the head's place across the window", () => {
  it('is the middle of a narrow window, whatever the page shows', () => {
    expect(headCentre(375, 812, 12)).toBe(187.5);
    expect(headCentre(767, 1024, 600)).toBe(383.5);
  });

  it('is the middle of the free space left of the cards on a wide window', () => {
    expect(headCentre(1440, 900, 700)).toBe(350);
  });

  it('is the middle of a wide window whose page has nothing beside it', () => {
    expect(headCentre(1440, 900, undefined)).toBe(720);
  });

  it('goes back to the middle when the free space is narrower than the face', () => {
    const face = 2 * HEAD_REACH * 900;
    expect(headCentre(1024, 900, face - 1)).toBe(512);
    expect(headCentre(1024, 900, face)).toBe(face / 2);
  });

  it('measures the look from a twelfth of the window right of the head', () => {
    framedHead.x = Number.NaN;
    expect(lookOrigin(1200)).toBe(700);
    framedHead.x = 300;
    expect(lookOrigin(1200)).toBe(400);
    framedHead.x = Number.NaN;
  });

  it('glides off gently, then speeds up, and settles without overshooting', () => {
    let state = { x: 0, speed: 0 };
    const path: number[] = [];
    for (let frame = 0; frame < 240; frame++) {
      state = glide(state, 100, 1 / 60);
      path.push(state.x);
    }
    const steps = path.map((x, k) => x - (path[k - 1] ?? 0));
    // Its first step is smaller than the ones that follow it.
    expect(steps[0]).toBeLessThan(steps[5]!);
    // Most of the way there in about GLIDE_SECONDS, and never past it.
    expect(path[Math.round(GLIDE_SECONDS * 60)]).toBeGreaterThan(85);
    expect(Math.max(...path)).toBeLessThanOrEqual(100);
    expect(path.at(-1)).toBeCloseTo(100, 1);
  });

  it('moves the same at any frame rate', () => {
    const after = (fps: number) => {
      let state = { x: 0, speed: 0 };
      for (let frame = 0; frame < fps / 2; frame++)
        state = glide(state, 100, 1 / fps);
      return state.x;
    };
    expect(Math.abs(after(30) - after(120))).toBeLessThan(2);
  });

  it('keeps its speed when the target moves mid-glide', () => {
    let state = { x: 0, speed: 0 };
    for (let frame = 0; frame < 20; frame++) state = glide(state, 100, 1 / 60);
    const before = state.speed;
    state = glide(state, 200, 1 / 60);
    // The next step bends the motion rather than restarting or jerking it.
    expect(state.speed).toBeGreaterThan(before * 0.9);
  });
});
