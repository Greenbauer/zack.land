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

  it('keeps to the height of a box too short for the width, centred across', () => {
    expect(videoFill(1000, 360)).toEqual({
      x: 180,
      y: 0,
      width: 640,
      height: 360,
      tilt: 0,
    });
  });
});
