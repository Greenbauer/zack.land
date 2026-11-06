import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  drawsInSoftware,
  FIRST_FRAMES,
  isSoftwareRenderer,
  markSoftware,
  onSoftware,
  renderQuality,
  SLOW_FRAMES,
  slowFrames,
  WATCHED_FRAMES,
} from './quality';

describe('how finely the scene is drawn', () => {
  it('draws a phone at up to 1.5 pixels per CSS pixel, unsmoothed', () => {
    // An iPhone 13 Pro, upright and on its side.
    for (const [width, height] of [
      [390, 844],
      [844, 390],
    ])
      expect(renderQuality(width!, height!)).toEqual({
        dpr: [1, 1.5],
        samples: 0,
      });
  });

  it('draws a larger screen at up to 2, with 4 samples', () => {
    expect(renderQuality(1440, 900)).toEqual({ dpr: [1, 2], samples: 4 });
  });

  it('draws at half a pixel, unsmoothed, where the browser has no GPU', () => {
    for (const [width, height] of [
      [1440, 900],
      [390, 844],
    ])
      expect(renderQuality(width!, height!, true)).toEqual({
        dpr: [0.5, 0.5],
        samples: 0,
      });
  });

  it('knows a CPU renderer from a GPU', () => {
    for (const cpu of [
      'ANGLE (Google, Vulkan 1.3.0 (SwiftShader Device (LLVM 10.0.0) (0x0000C0DE)), SwiftShader driver)',
      'llvmpipe (LLVM 15.0.7, 256 bits)',
      'Microsoft Basic Render Driver',
    ])
      expect(isSoftwareRenderer(cpu)).toBe(true);
    for (const gpu of [
      'ANGLE (Apple, ANGLE Metal Renderer: Apple M4 Pro, Unspecified Version)',
      'ANGLE (NVIDIA, NVIDIA GeForce RTX 3080 Direct3D11 vs_5_0 ps_5_0, D3D11)',
      'Apple GPU',
      'Adreno (TM) 730',
    ])
      expect(isSoftwareRenderer(gpu)).toBe(false);
  });
});

describe('a scene drawn in software that its renderer hides', () => {
  afterEach(() => vi.unstubAllGlobals());

  // Feeds `deltas` (seconds) to a fresh watch: the frame it first says so at
  // (from 1), or 0.
  const slowAt = (deltas: number[]) => {
    const slow = slowFrames();
    return deltas.findIndex((delta) => slow(delta)) + 1;
  };

  it('is found from two slow frames in a row, after the first two', () => {
    // CI's WebKit, drawing in full on its CPU: seconds a frame.
    expect(slowAt([3, 4, 2.5, 6, 3])).toBe(FIRST_FRAMES + SLOW_FRAMES);
  });

  it('is not found from a GPU’s frames, nor its first slow ones', () => {
    // The first frames compile the shaders; then a sixtieth of a second each.
    expect(slowAt([2, 1.5, ...Array(40).fill(1 / 60)])).toBe(0);
  });

  it('is not found from one slow frame at a time', () => {
    expect(slowAt([0.02, 0.02, 0.9, 0.02, 0.9, 0.02, 0.9, 0.02])).toBe(0);
  });

  it('is watched for only as the scene starts', () => {
    // A tab left hidden and shown again, or a heavy page loading, later on.
    expect(slowAt([...Array(WATCHED_FRAMES).fill(1 / 60), 5, 5, 5])).toBe(0);
  });

  it('draws in software from then on, telling the scene once', () => {
    const setAttribute = vi.fn();
    vi.stubGlobal('document', { documentElement: { setAttribute } });
    const told = vi.fn();
    const stop = onSoftware(told);
    markSoftware();
    markSoftware();
    stop();
    expect(drawsInSoftware()).toBe(true);
    expect(setAttribute).toHaveBeenCalledWith('data-software', '');
    expect(told).toHaveBeenCalledTimes(1);
  });
});
