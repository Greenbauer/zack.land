import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  drawsInSoftware,
  FIRST_FRAMES,
  isHiddenRenderer,
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

  it('knows a renderer that hides what draws', () => {
    for (const hidden of ['Apple GPU', ''])
      expect(isHiddenRenderer(hidden)).toBe(true);
    for (const named of [
      'ANGLE (Apple, ANGLE Metal Renderer: Apple M4 Pro, Unspecified Version)',
      'llvmpipe (LLVM 15.0.7, 256 bits)',
      'Adreno (TM) 730',
    ])
      expect(isHiddenRenderer(named)).toBe(false);
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

describe('a hidden renderer, timed as the page opens', () => {
  // Each test asks a fresh module: the answer is kept once found.
  beforeEach(() => vi.resetModules());
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  // A WebGL context named `renderer` whose clock moves `ms` a reading, so
  // each timed draw takes `ms`; and the GL calls it was asked for.
  const fakeGl = (renderer: string | null, ms: number) => {
    const calls: string[] = [];
    const gl = new Proxy({} as Record<string, unknown>, {
      get: (_, key: string) => {
        if (key === 'canvas') return {};
        if (key === 'getExtension')
          return (name: string) =>
            name === 'WEBGL_debug_renderer_info'
              ? renderer === null
                ? null
                : { UNMASKED_RENDERER_WEBGL: 1 }
              : { loseContext() {} };
        if (key === 'getParameter') return () => renderer;
        return (...args: unknown[]) => {
          calls.push(key);
          return args.length ? undefined : {};
        };
      },
    });
    let now = 0;
    vi.spyOn(performance, 'now').mockImplementation(() => (now += ms));
    return { gl, calls };
  };
  const onPage = async (renderer: string | null, ms: number) => {
    const { gl, calls } = fakeGl(renderer, ms);
    vi.stubGlobal('document', {
      createElement: () => ({ getContext: () => gl }),
    });
    const quality = await import('./quality');
    return { software: quality.drawsInSoftware(), calls };
  };

  it('draws in software where the test is slow', async () => {
    const { SLOW_TEST_MS } = await import('./quality');
    // Linux WebKit on a CI runner's CPU: 22 ms and up.
    expect((await onPage('Apple GPU', 22)).software).toBe(true);
    vi.resetModules();
    expect((await onPage(null, SLOW_TEST_MS * 2)).software).toBe(true);
  });

  it('draws on the GPU where the test is quick', async () => {
    // A Mac's GPU in WebKit: a millisecond.
    const gpu = await onPage('Apple GPU', 1);
    expect(gpu.software).toBe(false);
    expect(gpu.calls).toContain('drawArrays');
  });

  it('draws on the GPU where the test cannot be drawn', async () => {
    const { gl } = fakeGl('Apple GPU', 50);
    vi.stubGlobal('document', {
      createElement: () => ({
        getContext: () =>
          new Proxy(gl, {
            get: (target, key: string) =>
              key === 'shaderSource'
                ? () => {
                    throw new Error('context lost');
                  }
                : target[key],
          }),
      }),
    });
    const { drawsInSoftware } = await import('./quality');
    expect(drawsInSoftware()).toBe(false);
  });

  it('trusts a renderer that names itself, untested', async () => {
    const gpu = await onPage(
      'ANGLE (Apple, ANGLE Metal Renderer: Apple M4)',
      50,
    );
    expect(gpu.software).toBe(false);
    expect(gpu.calls).not.toContain('drawArrays');
    vi.resetModules();
    expect((await onPage('llvmpipe (LLVM 15.0.7)', 0)).software).toBe(true);
  });

  it('tests the same way in the worker, posting its time', async () => {
    const { PROBE, SLOW_TEST_MS } = await import('./quality');
    const posted = (renderer: string | null, ms: number) => {
      const { gl } = fakeGl(renderer, ms);
      let message: unknown;
      new Function('OffscreenCanvas', 'postMessage', PROBE)(
        function OffscreenCanvas() {
          return { getContext: () => gl };
        },
        (data: unknown) => (message = data),
      );
      return message as { renderer: string; ms: number };
    };
    expect(posted('Apple GPU', 30).ms).toBeGreaterThan(SLOW_TEST_MS);
    expect(posted('Apple GPU', 1).ms).toBeLessThan(SLOW_TEST_MS);
    expect(posted('Adreno (TM) 730', 30)).toEqual({
      renderer: 'Adreno (TM) 730',
      ms: 0,
    });
  });
});

describe('the worker’s answer', () => {
  beforeEach(() => vi.resetModules());
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  // askDrawsInSoftware, its worker posting `answer`; on the page, `page`
  // stands for drawsInSoftware's own context, a renderer and a test time.
  const ask = async (
    answer: { renderer: string; ms: number } | null,
    page?: { renderer: string; ms: number },
  ) => {
    class FakeWorker {
      onmessage?: (_: { data: unknown }) => void;
      onerror?: () => void;
      constructor() {
        queueMicrotask(() => this.onmessage?.({ data: answer }));
      }
      terminate() {}
    }
    vi.stubGlobal('Worker', FakeWorker);
    vi.stubGlobal('OffscreenCanvas', class {});
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:probe');
    vi.spyOn(URL, 'revokeObjectURL').mockReturnValue();
    const opened = vi.fn();
    vi.stubGlobal('document', {
      createElement: () => ({
        getContext: () => {
          opened();
          if (!page) return null;
          let now = 0;
          vi.spyOn(performance, 'now').mockImplementation(
            () => (now += page.ms),
          );
          return new Proxy({} as Record<string, unknown>, {
            get: (_, key: string) =>
              key === 'canvas'
                ? {}
                : key === 'getExtension'
                  ? (name: string) =>
                      name === 'WEBGL_debug_renderer_info'
                        ? { UNMASKED_RENDERER_WEBGL: 1 }
                        : { loseContext() {} }
                  : key === 'getParameter'
                    ? () => page.renderer
                    : () => ({}),
          });
        },
      }),
    });
    const { askDrawsInSoftware } = await import('./quality');
    return { software: await askDrawsInSoftware(), opened };
  };

  it('is the GPU where the worker’s test is quick, asked on the page never', async () => {
    // Safari on a Mac: "Apple GPU", drawn in a millisecond off the page.
    const answer = await ask({ renderer: 'Apple GPU', ms: 1 });
    expect(answer.software).toBe(false);
    expect(answer.opened).not.toHaveBeenCalled();
  });

  it('is software where the worker’s test is slow, or its renderer says so', async () => {
    expect((await ask({ renderer: 'Apple GPU', ms: 30 })).software).toBe(true);
    vi.resetModules();
    expect((await ask({ renderer: 'llvmpipe', ms: 0 })).software).toBe(true);
  });

  it('is asked on the page where the worker cannot draw', async () => {
    // Linux WebKit: no WebGL in a worker, the CPU on the page.
    const slow = await ask(null, { renderer: 'Apple GPU', ms: 30 });
    expect(slow.opened).toHaveBeenCalledTimes(1);
    expect(slow.software).toBe(true);
    vi.resetModules();
    expect((await ask(null, { renderer: 'Apple GPU', ms: 1 })).software).toBe(
      false,
    );
  });
});
