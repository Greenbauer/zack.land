import { describe, expect, it } from 'vitest';

import {
  frameSettler,
  PAGE_IN_AT_MOST_MS,
  PAGE_MOTION_MS,
  pageInDelay,
  sceneDelay,
  SMOOTH_FRAMES,
} from './sceneReady';

describe('frameSettler', () => {
  it('settles once enough quick frames come in a row', () => {
    const settled = frameSettler();
    const quick = Array.from({ length: SMOOTH_FRAMES }, () => settled(1 / 60));
    expect(quick.slice(0, -1).every((done) => !done)).toBe(true);
    expect(quick.at(-1)).toBe(true);
  });

  it('starts counting over after a stalled frame', () => {
    const settled = frameSettler(3, 0.1);
    settled(0.016);
    settled(0.016);
    expect(settled(0.8)).toBe(false);
    expect(settled(0.016)).toBe(false);
    expect(settled(0.016)).toBe(false);
    expect(settled(0.016)).toBe(true);
  });
});

describe('pageInDelay', () => {
  it('starts the page moving half a second into its load at the latest', () => {
    expect(PAGE_IN_AT_MOST_MS).toBe(500);
    expect(pageInDelay(120)).toBe(380);
  });

  it('starts it at once once that time has passed, as on a later page', () => {
    expect(pageInDelay(500)).toBe(0);
    expect(pageInDelay(42_000)).toBe(0);
  });
});

describe('sceneDelay', () => {
  it('starts the scene at once on a GPU', () => {
    expect(sceneDelay(120, false)).toBe(0);
  });

  it('waits for the page to move in first when WebGL is drawn in software', () => {
    expect(sceneDelay(120, true)).toBe(380 + PAGE_MOTION_MS);
    expect(sceneDelay(42_000, true)).toBe(PAGE_MOTION_MS);
  });
});
