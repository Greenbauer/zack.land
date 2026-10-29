import { describe, expect, it } from 'vitest';

import { HEAD_REACH } from '@/components/collageLayout';

import {
  AWAY_HEIGHTS,
  framedHead,
  glide,
  GLIDE_SECONDS,
  headCentre,
  lookOrigin,
  stepHead,
} from './headPlace';

describe("the head's place across the window", () => {
  it('is the middle of a narrow window when no card covers it', () => {
    expect(headCentre(375, 812, 12)).toBe(187.5);
    expect(headCentre(767, 1024, 600)).toBe(383.5);
  });

  it('goes off the left of a narrow window while a card covers it', () => {
    expect(headCentre(390, 844, -240, true)).toBe(-AWAY_HEIGHTS * 844);
    expect(headCentre(390, 844, -240, true)).toBeLessThan(-844 / 2);
  });

  it('keeps to the content frame on a window wider than it', () => {
    // A 3440 wide window with the 1536 frame centred in it.
    const frame = { left: 952, right: 2488 };
    // A card starting 600px into the frame: the head halfway to it.
    expect(headCentre(3440, 1440, 1552, false, frame)).toBe(952 + 300);
    // Nothing beside it: the frame's middle, the window's middle here.
    expect(headCentre(3440, 1440, undefined, false, frame)).toBe(1720);
    // Too little room beside the title: the frame's middle too.
    expect(headCentre(3440, 1440, 1100, false, frame)).toBe(1720);
  });

  it('goes off the left of a wide window when a card leaves it no room', () => {
    // A tablet: the post's card spans the frame.
    const frame = { left: 12, right: 1012 };
    expect(headCentre(1024, 1200, 12, true, frame)).toBe(-AWAY_HEIGHTS * 1200);
    // The same room beside a title (not a card) keeps the head in the middle.
    expect(headCentre(1024, 1200, 12, false, frame)).toBe(512);
  });

  it('stays in the free space beside a card on a wide window', () => {
    expect(headCentre(1440, 900, 700, true)).toBe(350);
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

  it('goes off the left of a wide window when a card leaves it too little room', () => {
    const face = 2 * HEAD_REACH * 1000;
    expect(headCentre(910, 1000, 71, true)).toBe(-AWAY_HEIGHTS * 1000);
    expect(headCentre(910, 1000, face, true)).toBe(face / 2);
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

  it('takes its first place at once, then glides', () => {
    const head = { x: 450, speed: 0 };
    // Until it has been placed, however slow the frames: straight there.
    expect(stepHead(head, -300, 1, false)).toEqual({ x: -300, speed: 0 });
    expect(stepHead({ x: Number.NaN, speed: 0 }, 80, 0.5, true)).toEqual({
      x: 80,
      speed: 0,
    });
    // Once placed, a glide: part of the way in a frame.
    const step = stepHead(head, -300, 1 / 60, true);
    expect(step.x).toBeLessThan(450);
    expect(step.x).toBeGreaterThan(-300);
  });
});
