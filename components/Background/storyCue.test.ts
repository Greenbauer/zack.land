import { afterEach, describe, expect, it } from 'vitest';

import { faceTargets } from './headFace';
import { headMood } from './headMood';
import { idle } from './idleGreeting';
import { cueBeat, cueFace, cueLook, StoryCue } from './storyCue';

const cue: StoryCue = {
  since: 10,
  card: { x: 200, y: 150 },
  beats: [
    { at: 0, face: { smile: 0.4 }, look: 'card' },
    { at: 2, face: { gasp: 0.6 }, look: 'camera' },
    { at: 4, face: { smile: 1 } },
  ],
};

describe("the story's cue", () => {
  it('asks for nothing before its first beat', () => {
    expect(cueBeat(cue, 9.5)).toBeNull();
    expect(cueFace(cue, 9.5)).toEqual({});
    expect(cueLook(cue, 9.5)).toBeNull();
  });

  it('holds each beat until the next', () => {
    expect(cueFace(cue, 10)).toEqual({ smile: 0.4 });
    expect(cueFace(cue, 11.9)).toEqual({ smile: 0.4 });
    expect(cueFace(cue, 12)).toEqual({ gasp: 0.6 });
    expect(cueFace(cue, 99)).toEqual({ smile: 1 });
  });

  it('looks at the card, the camera, or leaves the look alone', () => {
    expect(cueLook(cue, 10.5)).toEqual({ x: 200, y: 150 });
    expect(cueLook(cue, 12.5)).toEqual({ x: 0, y: 0 });
    expect(cueLook(cue, 15)).toBeNull();
    expect(
      cueLook({ ...cue, beats: [{ at: 0, face: {}, look: 'up' }] }, 10),
    ).toMatchObject({ y: expect.any(Number) });
    expect(
      cueLook({ ...cue, beats: [{ at: 0, face: {}, look: 'up' }] }, 10)!.y,
    ).toBeLessThan(0);
  });
});

describe('the face, with a cue on', () => {
  afterEach(() => {
    headMood.cue = null;
  });

  const face = (now: number) =>
    faceTargets(
      { taps: { phase: 'none' }, greeting: idle, searching: false },
      { x: 0, y: 0 },
      { x: 0, y: 0 },
      { x: 0, y: 0 },
      { width: 1000, height: 800 },
      now,
    );

  it("lays the story's face over the pointer's reactions", () => {
    headMood.cue = cue;
    expect(face(12.5).gasp).toBe(0.6);
    expect(face(10.5).smile).toBe(0.4);
  });

  it('makes no story face with no cue', () => {
    expect(face(12.5).gasp).toBeUndefined();
  });
});
