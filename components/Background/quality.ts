import { isSmall } from './smallScreen';

// How finely the scene is drawn on a window `width` by `height` CSS pixels:
// its pixel ratio (the range three may pick from, by the screen's own) and
// how many samples smooth its edges. Every pass after the first draws the
// whole frame again, so each extra pixel and sample costs several times over.
// A phone's screen is dense enough to hide jagged edges and its GPU is
// small, so it draws at up to 1.5 pixels per CSS pixel without smoothing; a
// larger screen at up to 2, with 4 samples (8, drei's default, looks no
// smoother over the soft sky and glossy head).
// A browser with no GPU to draw on (a virtual machine, a CI runner) draws
// WebGL on its CPU (SwiftShader, llvmpipe), a few frames a second at best,
// and each frame holds up the whole page: clicks, timers and text all wait
// on it. There the scene is drawn at half a pixel per CSS pixel without
// smoothing, a quarter of the pixels, so the page stays responsive; it is
// softer, but a software-drawn scene was never smooth anyway.
export function renderQuality(width: number, height: number, software = false) {
  if (software) return { dpr: [0.5, 0.5] as [number, number], samples: 0 };
  return isSmall(width, height)
    ? { dpr: [1, 1.5] as [number, number], samples: 0 }
    : { dpr: [1, 2] as [number, number], samples: 4 };
}

// Whether the WebGL renderer named `renderer` draws on the CPU.
export const isSoftwareRenderer = (renderer: string) =>
  /swiftshader|llvmpipe|softpipe|software|basic render/i.test(renderer);

// Whether this browser draws WebGL on the CPU, asked once of a throwaway
// context (false where WebGL does not say, as most real GPUs do say, and on
// the server, where the page is first rendered and nothing is drawn).
let software: boolean | undefined;
export function drawsInSoftware() {
  if (typeof document === 'undefined') return false;
  if (software !== undefined) return software;
  const gl = document.createElement('canvas').getContext('webgl');
  const info = gl?.getExtension('WEBGL_debug_renderer_info');
  software =
    !!gl &&
    !!info &&
    isSoftwareRenderer(String(gl.getParameter(info.UNMASKED_RENDERER_WEBGL)));
  gl?.getExtension('WEBGL_lose_context')?.loseContext();
  return software;
}
