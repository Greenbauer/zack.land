import {
  HalfFloatType,
  OrthographicCamera,
  Scene,
  WebGLRenderer,
  WebGLRenderTarget,
} from 'three';
import { describe, expect, it } from 'vitest';

import { TITLE_LAYER, TitlePass } from './focusBlur';

// A renderer that records what it is asked to draw into, and keeps the clear
// colour it is given.
function fakeRenderer() {
  const calls: { into: WebGLRenderTarget | null; what: string }[] = [];
  let into: WebGLRenderTarget | null = null;
  let clear = { hex: 0x6864a8, alpha: 1 };
  const renderer = {
    autoClear: true,
    getClearAlpha: () => clear.alpha,
    getClearColor: (colour: { setHex: (..._hex: [number]) => void }) =>
      colour.setHex(clear.hex),
    setClearColor: (colour: number | { getHex: () => number }, alpha = 1) => {
      clear = {
        hex: typeof colour === 'number' ? colour : colour.getHex(),
        alpha,
      };
      calls.push({ into, what: `clear colour ${clear.hex} ${alpha}` });
    },
    setRenderTarget: (target: WebGLRenderTarget | null) => {
      into = target;
    },
    clear: () => calls.push({ into, what: 'clear' }),
    clearDepth: () => calls.push({ into, what: 'clear depth' }),
    render: (scene: Scene) =>
      calls.push({ into, what: scene.isScene ? 'titles' : 'over' }),
  };
  return {
    renderer: renderer as unknown as WebGLRenderer,
    calls,
    clear: () => clear,
  };
}

const frame = new WebGLRenderTarget(585, 1266, { type: HalfFloatType });
const world = { scene: new Scene(), camera: new OrthographicCamera() };

describe('the titles drawn over the frame', () => {
  it('without samples of their own, draws them straight into the frame', () => {
    const pass = new TitlePass(() => world);
    const { renderer, calls } = fakeRenderer();
    pass.render(renderer, frame, frame);
    expect(calls).toEqual([
      { into: frame, what: 'clear depth' },
      { into: frame, what: 'titles' },
    ]);
  });

  it('with samples, draws them smoothed on their own and lays them over', () => {
    const pass = new TitlePass(() => world);
    pass.samples = 4;
    const { renderer, calls, clear } = fakeRenderer();
    pass.render(renderer, frame, frame);
    const own = calls.find((call) => call.what === 'titles')!.into!;
    expect(own).not.toBe(frame);
    expect(own.samples).toBe(4);
    expect([own.width, own.height]).toEqual([585, 1266]);
    expect(own.texture.type).toBe(HalfFloatType);
    // Cleared to nothing around the letters, the page's clear colour put back,
    // then laid over the frame.
    expect(calls.map((call) => call.what)).toEqual([
      'clear colour 0 0',
      'clear',
      'titles',
      `clear colour ${0x6864a8} 1`,
      'over',
    ]);
    expect(calls.at(-1)!.into).toBe(frame);
    expect(clear()).toEqual({ hex: 0x6864a8, alpha: 1 });
    expect(renderer.autoClear).toBe(true);
  });

  it('follows the frame’s size, and lets its target go when smoothing stops', () => {
    const pass = new TitlePass(() => world);
    pass.samples = 4;
    const { renderer, calls } = fakeRenderer();
    pass.render(renderer, frame, frame);
    const bigger = new WebGLRenderTarget(800, 1600, { type: HalfFloatType });
    pass.render(renderer, bigger, bigger);
    const own = calls.filter((call) => call.what === 'titles').at(-1)!.into!;
    expect([own.width, own.height]).toEqual([800, 1600]);
    let freed = false;
    own.addEventListener('dispose', () => (freed = true));
    pass.samples = 0;
    pass.render(renderer, frame, frame);
    expect(freed).toBe(true);
    expect(calls.at(-1)).toEqual({ into: frame, what: 'titles' });
  });

  it('draws only the titles’ layer, and puts the camera back', () => {
    const pass = new TitlePass(() => world);
    const seen: number[] = [];
    const { renderer } = fakeRenderer();
    const render = renderer.render.bind(renderer);
    renderer.render = (scene, camera) => {
      seen.push(camera.layers.mask);
      render(scene, camera);
    };
    const before = world.camera.layers.mask;
    pass.render(renderer, frame, frame);
    expect(seen).toEqual([1 << TITLE_LAYER]);
    expect(world.camera.layers.mask).toBe(before);
  });
});
