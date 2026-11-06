import { useSyncExternalStore } from 'react';

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

// Whether `renderer` hides what draws: WebKit names every renderer "Apple
// GPU", a real GPU or none, and a browser that will not say gives no name.
export const isHiddenRenderer = (renderer: string) =>
  /^(apple gpu)?$/i.test(renderer.trim());

// Where the name hides it, a small test is drawn and timed instead: how
// long, in milliseconds, `gl` takes to draw a 256-pixel square four times
// through a shader that loops 32 times, read back so the wait is timed, the
// faster of two tries, after one draw that compiles the shader. A GPU,
// Apple's included, takes about a millisecond; WebKit drawing on its CPU
// (Linux in a CI runner, at 2 to 4 cores) 22 to 83. It runs in the probe's
// worker as well, as written here (askDrawsInSoftware), so it reads nothing
// from outside itself.
export const SLOW_TEST_MS = 10;
export function testDrawTime(gl: WebGLRenderingContext) {
  gl.canvas.width = 256;
  gl.canvas.height = 256;
  gl.viewport(0, 0, 256, 256);
  const program = gl.createProgram()!;
  const attach = (type: number, source: string) => {
    const shader = gl.createShader(type)!;
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    gl.attachShader(program, shader);
  };
  attach(
    gl.VERTEX_SHADER,
    'attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}',
  );
  attach(
    gl.FRAGMENT_SHADER,
    'precision mediump float;uniform float t;void main(){vec2 u=gl_FragCoord.xy/256.;float a=t;for(int i=0;i<32;i++)a=sin(a*1.7+u.x)*cos(a+u.y);gl_FragColor=vec4(a,u,1.);}',
  );
  gl.bindAttribLocation(program, 0, 'p');
  gl.linkProgram(program);
  gl.useProgram(program);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([-1, -1, 3, -1, -1, 3]),
    gl.STATIC_DRAW,
  );
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  const t = gl.getUniformLocation(program, 't');
  const pixel = new Uint8Array(4);
  const draw = (times: number) => {
    const start = performance.now();
    for (let i = 0; i < times; i += 1) {
      gl.uniform1f(t, i);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }
    gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixel);
    return performance.now() - start;
  };
  draw(1);
  return Math.min(draw(4), draw(4));
}

// Whether the renderer named `renderer` on `gl` draws on the CPU, by its
// name or, where that hides it, by the test.
// A context lost as it opens cannot draw the test (its calls throw); that
// browser is taken to have a GPU, so the scene still starts, and its first
// frames still say otherwise if it has none.
function drawsOnCpu(gl: WebGLRenderingContext, renderer: string) {
  if (isSoftwareRenderer(renderer)) return true;
  if (!isHiddenRenderer(renderer)) return false;
  try {
    return testDrawTime(gl) > SLOW_TEST_MS;
  } catch {
    return false;
  }
}

// Whether this browser draws WebGL on the CPU, asked once of a throwaway
// context (false on the server, where the page is first rendered and nothing
// is drawn), or found from the scene's first frames (slowFrames).
let software: boolean | undefined;
export function drawsInSoftware() {
  if (typeof document === 'undefined') return false;
  if (software !== undefined) return software;
  const gl = document.createElement('canvas').getContext('webgl');
  const info = gl?.getExtension('WEBGL_debug_renderer_info');
  software =
    !!gl &&
    drawsOnCpu(
      gl,
      info ? String(gl.getParameter(info.UNMASKED_RENDERER_WEBGL)) : '',
    );
  gl?.getExtension('WEBGL_lose_context')?.loseContext();
  return software;
}

// The same, asked off the page's main thread, from a worker's OffscreenCanvas:
// a browser drawing in software takes long enough to open a WebGL context
// that, asked on the main thread as the page opens, it stalls the page's own
// motion. The worker posts the renderer's name and, where that hides it, the
// test's time, or null where it cannot draw (Linux WebKit), and then it is
// asked on the main thread. Once answered, drawsInSoftware gives the same
// answer without asking again.
export const PROBE = `const isHidden = ${isHiddenRenderer};
const testDrawTime = ${testDrawTime};
const gl = new OffscreenCanvas(1, 1).getContext('webgl');
const info = gl && gl.getExtension('WEBGL_debug_renderer_info');
const renderer = info ? String(gl.getParameter(info.UNMASKED_RENDERER_WEBGL)) : '';
postMessage(gl ? { renderer, ms: isHidden(renderer) ? testDrawTime(gl) : 0 } : null);`;
type Answer = { renderer: string; ms: number } | null;
let asked: Promise<boolean> | undefined;
export function askDrawsInSoftware(): Promise<boolean> {
  if (software !== undefined) return Promise.resolve(software);
  if (typeof Worker === 'undefined' || typeof OffscreenCanvas === 'undefined')
    return Promise.resolve(drawsInSoftware());
  asked ??= new Promise((resolve) => {
    const url = URL.createObjectURL(
      new Blob([PROBE], { type: 'text/javascript' }),
    );
    const worker = new Worker(url);
    const answer = (found: Answer) => {
      worker.terminate();
      URL.revokeObjectURL(url);
      software ??=
        found === null
          ? drawsInSoftware()
          : isSoftwareRenderer(found.renderer) || found.ms > SLOW_TEST_MS;
      resolve(software);
    };
    worker.onmessage = (event: MessageEvent<Answer>) => answer(event.data);
    worker.onerror = () => answer(null);
  });
  return asked;
}

// A test can still miss it (a busy machine's test drawn between its slow
// moments), and where it does the scene is drawn in full on the CPU, seconds
// a frame, with the whole page waiting on each. So the scene's first frames
// are timed as well (index.tsx):
// slowFrames takes each frame's time since the last, in seconds, and is true
// once SLOW_FRAMES in a row have each taken longer than SLOW_SECONDS, leaving
// out the first FIRST_FRAMES (which compile the shaders and upload the
// textures) and watching only until WATCHED_FRAMES, so a later hitch (a
// hidden tab, a page's load) is never taken for it. A GPU draws a frame in
// milliseconds, a phone's included, and never comes near.
export const SLOW_SECONDS = 0.5;
export const SLOW_FRAMES = 2;
export const FIRST_FRAMES = 2;
export const WATCHED_FRAMES = 30;
export function slowFrames() {
  let frame = 0;
  let run = 0;
  return (delta: number) => {
    frame += 1;
    if (frame <= FIRST_FRAMES || frame > WATCHED_FRAMES) return false;
    run = delta > SLOW_SECONDS ? run + 1 : 0;
    return run >= SLOW_FRAMES;
  };
}

// From then on it draws in software, as if its renderer had said so: the
// scene, already drawing, takes the smaller size and drops its smoothing
// (useDrawsInSoftware).
const listeners = new Set<() => void>();
export function markSoftware() {
  if (software) return;
  software = true;
  document.documentElement.setAttribute('data-software', '');
  for (const listener of listeners) listener();
}
export const onSoftware = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};
// It reads only what is already known, never asking itself: asked as the
// page opens, it would open a WebGL context on the main thread, which
// askDrawsInSoftware exists to avoid. The scene is drawn only once that has
// answered (index.tsx).
export const useDrawsInSoftware = () =>
  useSyncExternalStore(
    onSoftware,
    () => software ?? false,
    () => false,
  );
