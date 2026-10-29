import { describe, expect, it } from 'vitest';

import { videoFill } from './videoFill';

describe('videoFill', () => {
  it('spans the whole width of a box tall enough, centred down it', () => {
    expect(videoFill(800, 600)).toEqual({
      x: 0,
      y: 75,
      width: 800,
      height: 450,
      tilt: 0,
    });
  });

  it('still spans the whole width of a box too short for 16:9, at its height', () => {
    expect(videoFill(1000, 360)).toEqual({
      x: 0,
      y: 0,
      width: 1000,
      height: 360,
      tilt: 0,
    });
  });
});
