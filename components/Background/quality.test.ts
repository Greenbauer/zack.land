import { describe, expect, it } from 'vitest';

import { isSoftwareRenderer, renderQuality } from './quality';

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
