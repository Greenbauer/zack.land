import { describe, expect, it } from 'vitest';

import { frameSettler, SMOOTH_FRAMES } from './sceneReady';

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
