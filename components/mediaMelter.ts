import { Box, Picture, uploadsAgain } from './mediaBender';

// Draws a post's pictures melting: going out each turns to liquid at once and
// runs off to the window's right side, narrowing into a streak, a band at a
// time; coming in it runs back the same way and settles into place. The look
// is the pointer's bend (mediaBender.ts) made to order, its colours parting
// the same way, across a whole picture rather than along the pointer's trail.
// At `melt` 1 it draws the picture exactly where it rests, so the picture
// itself can take over with no jump, and at 0 it draws nothing.
// Every picture of a turn narrows onto one line, so what goes and what comes
// share a streak. They are drawn to a layer each, then interleaved in fine
// lanes along it, so the streak reads as one liquid of both. With nothing to
// mix with, a group streams by itself.

// How long a picture takes, in seconds, on its way in and out.
export const MELT_IN_S = 1;
export const MELT_OUT_S = 1;

// How far ahead of each other the bands of a picture go, as a share of the
// melt: more leaves longer streaks, but holds back the last to leave.
const SPREAD = 0.4;
// How many times its own width a picture stretches on the way out.
const STRETCH = 5.0;
// How fast the streak's line follows the pictures, per second.
const LINE_EASE = 5;
// How far past the window's right side a picture runs, in shares of the way.
const OVERSHOOT = 1.6;
// How much of its height a picture narrows to in the streak.
const NARROW = 0.3;

// Where the streak of a turn runs, the middle (CSS pixels down the window) of
// the pictures going `boxes`: halfway down their outlines' tops and bottoms.
export function streakLine(boxes: readonly Box[]) {
  if (!boxes.length) return 0;
  const top = Math.min(...boxes.map((box) => box.y));
  const bottom = Math.max(...boxes.map((box) => box.y + box.height));
  return (top + bottom) / 2;
}

// The streak's line `seconds` on, easing from `line` to `target`: a group
// finishing moves the middle of what is left, and the streak follows rather
// than jumps.
export const easeLine = (line: number, target: number, seconds: number) =>
  target + (line - target) * Math.exp(-seconds * LINE_EASE);

// How hard the flow stirs the pictures, 0 to 1, with `leaving` of those going
// out left and `coming` of those coming in arrived: most while there is plenty
// of both, and not at all with only one, so a picture alone melts as it is.
export const stirOf = (leaving: number, coming: number) =>
  Math.min(6 * leaving * coming, 1);

// One step of a picture's melt: `melt` after `seconds`, going in (`direction`
// 1) or out (-1).
export function stepMelt(melt: number, direction: 1 | -1, seconds: number) {
  const whole = direction > 0 ? MELT_IN_S : MELT_OUT_S;
  return Math.min(Math.max(melt + (direction * seconds) / whole, 0), 1);
}

// The power of two at least `side`, up to 2048.
export const squareSide = (side: number) =>
  Math.min(2 ** Math.ceil(Math.log2(Math.max(side, 1))), 2048);

// Whether a tile's resting place is read again this frame. Coming, yes: its
// card can still be moving into place. Going, only once: as the site leaves,
// the 404 page's card slides off carrying its tile, and a melt that followed
// it past the window's edge would run back in from there.
export const measuresRest = (direction: 1 | -1, rest: Box | null) =>
  direction > 0 || !rest;

// Where a tile rests in the window, whatever the page's scroll: the place in
// `post` of a tile at `tile` in `box`, with the post's top at `pageTop`, so a
// tile melting in or out stays put while the page glides past it.
export function restingBox(
  box: { left: number; top: number },
  post: { top: number },
  pageTop: number,
  tile: { x: number; y: number; width: number; height: number },
): Box {
  return {
    x: box.left + tile.x,
    y: pageTop + box.top - post.top + tile.y,
    width: tile.width,
    height: tile.height,
  };
}

const VERTEX = `
  attribute vec2 position;
  varying vec2 vUv;
  void main() {
    // From the top left, as the page counts.
    vUv = vec2(position.x * 0.5 + 0.5, 0.5 - position.y * 0.5);
    gl_Position = vec4(position, 0.0, 1.0);
  }`;

const NOISE = `
  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }
  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
      mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x),
      f.y);
  }`;

const FRAGMENT = `
  precision highp float;
  uniform sampler2D tMedia;
  uniform vec2 uSize;
  uniform vec4 uRest;
  uniform vec4 uShown;
  uniform vec4 uRadii;
  uniform float uMelt;
  uniform float uSeed;
  uniform float uDpr;
  uniform float uStreak;
  uniform float uTime;
  varying vec2 vUv;

  ${NOISE}

  vec3 picture(vec2 at) {
    return texture2D(tMedia, uShown.xy + clamp(at, 0.0, 1.0) * uShown.zw).rgb;
  }

  // How far inside the picture's rounded outline a point is, 0 to 1, softer as
  // it melts. Each corner has its own radius.
  float outline(vec2 at, float soft) {
    vec2 size = uRest.zw;
    vec2 q = (at - 0.5) * size;
    float radius = q.y < 0.0
      ? (q.x < 0.0 ? uRadii.x : uRadii.y)
      : (q.x < 0.0 ? uRadii.w : uRadii.z);
    vec2 d = abs(q) - size * 0.5 + radius;
    float dist = length(max(d, 0.0)) + min(max(d.x, d.y), 0.0) - radius;
    return 1.0 - smoothstep(-soft, soft, dist);
  }

  void main() {
    vec2 p = vUv * uSize;
    float across = p.x / uDpr;
    float row = p.y / uDpr;
    // Liquid at once: it ripples from the moment it leaves its place, and only
    // settles in the last moments of coming to rest.
    float liquid = 1.0 - smoothstep(0.9, 1.0, uMelt);
    float ripple = noise(vec2(across / 110.0 - uTime * 1.6, row / 70.0 + uSeed)) - 0.5;
    // Each band of the picture goes at its own moment: broad bands that wander
    // along their length, as water runs down glass.
    float wander = row + 50.0 * noise(vec2(across / 160.0, row / 130.0 + uSeed));
    float band = 0.75 * noise(vec2(wander / 70.0, uSeed))
      + 0.25 * noise(vec2(wander / 26.0, uSeed + 7.0));
    float melt = clamp(uMelt * (1.0 + ${SPREAD}) - band * ${SPREAD}, 0.0, 1.0);
    float gone = 1.0 - melt;
    // Every picture narrows onto the same line as it goes, so what is going and
    // what is coming run in one streak. It sways as a whole.
    float line = uStreak * uDpr
      + gone * uDpr * 110.0 * (noise(vec2(across / 300.0 - uTime * 0.7, 3.0)) - 0.5);
    float narrow = mix(1.0, ${NARROW}, smoothstep(0.0, 0.7, gone));
    float y = p.y + liquid * ripple * uDpr * (20.0 + gone * 70.0);
    vec2 t = (vec2(p.x, line + (y - line) / narrow) - uRest.xy) / uRest.zw;
    // Off to the window's right side, gathering speed, drawn out as it goes,
    // and well past it, so its slowest band has gone before its melt ends
    // rather than lingering at the edge.
    float far = ${OVERSHOOT} * (uSize.x - uRest.x) / uRest.z;
    float stretch = 1.0 + gone * ${STRETCH.toFixed(1)};
    vec2 at = vec2((t.x - gone * gone * far) / stretch, t.y);
    at.x += liquid * ripple * 0.05;
    float split = liquid * (0.012 + gone * 0.05);
    float soft = uDpr * (0.5 + liquid * (3.0 + gone * 20.0));
    float shown = outline(at, soft) * (1.0 - smoothstep(0.8, 1.0, gone));
    vec3 colour = vec3(
      picture(at + vec2(split, 0.0)).r,
      picture(at).g,
      picture(at - vec2(split, 0.0)).b);
    gl_FragColor = vec4(colour * shown, shown);
  }`;

// The two layers stirred together: the same flow carries both, and where both
// have liquid a marbling pattern says which shows. With nothing to stir, each
// passes through as drawn.
const MIX = `
  precision highp float;
  uniform sampler2D tLeaving;
  uniform sampler2D tComing;
  uniform vec2 uSize;
  uniform float uDpr;
  uniform float uStir;
  uniform float uComing;
  uniform float uTime;
  varying vec2 vUv;

  ${NOISE}

  float fbm(vec2 p) {
    float sum = 0.0;
    float amount = 0.5;
    for (int i = 0; i < 3; i++) {
      sum += amount * noise(p);
      p = p * 2.03 + 7.1;
      amount *= 0.5;
    }
    return sum / 0.875;
  }

  vec4 layer(sampler2D tLayer, vec2 at) {
    return texture2D(tLayer, vec2(at.x, 1.0 - at.y));
  }

  void main() {
    vec2 at = vUv;
    float marble = 0.5;
    if (uStir > 0.0) {
      vec2 css = vUv * uSize / uDpr;
      vec2 q = css / 260.0;
      vec2 first = vec2(
        fbm(q + vec2(0.0, uTime * 0.5)),
        fbm(q + vec2(5.2, 1.3 - uTime * 0.4))) - 0.5;
      vec2 flow = vec2(
        fbm(q + 3.0 * first + vec2(1.7, 9.2)),
        fbm(q + 3.0 * first + vec2(8.3, 2.8))) - 0.5;
      at += flow * uStir * 110.0 * uDpr / uSize;
      // Fine lanes along the streak, swept along it: the lanes of the new widen
      // until it has taken over.
      float lane = fbm(vec2(css.x / 480.0 - uTime * 0.8, css.y / 16.0) + 2.0 * flow);
      float front = mix(0.8, 0.2, uComing);
      marble = smoothstep(front - 0.2, front + 0.2, lane);
    }
    vec4 leaving = layer(tLeaving, at);
    vec4 coming = layer(tComing, at);
    // Each alone shows as it is; both, as the marbling says.
    float share = coming.a / max(leaving.a + coming.a, 0.001);
    gl_FragColor = mix(leaving, coming, mix(share, marble, leaving.a * coming.a));
  }`;

// `image` on a canvas with sides of a power of two, which WebGL 1 needs to
// smooth it (squareSide).
function squared(image: HTMLImageElement) {
  const canvas = document.createElement('canvas');
  canvas.width = squareSide(image.naturalWidth);
  canvas.height = squareSide(image.naturalHeight);
  canvas.getContext('2d')!.drawImage(image, 0, 0, canvas.width, canvas.height);
  return canvas;
}

type Layer = { frame: WebGLFramebuffer; texture: WebGLTexture };
type Uniforms = Record<string, WebGLUniformLocation | null>;

// The melt's shared canvas: `canvas` fills the window behind the post cards.
export class MediaMelter {
  private readonly gl: WebGLRenderingContext;
  private readonly textures = new WeakMap<
    Picture,
    { texture: WebGLTexture; src: string }
  >();
  private readonly melting: WebGLProgram;
  private readonly mixing: WebGLProgram;
  private readonly at: Uniforms;
  private readonly mixAt: Uniforms;
  private readonly layers: [Layer, Layer];

  // None where WebGL is missing or drawn in software, where this would crawl:
  // the tiles then slide (styles/globals.css).
  static on(canvas: HTMLCanvasElement) {
    const gl = canvas.getContext('webgl', {
      premultipliedAlpha: true,
      failIfMajorPerformanceCaveat: true,
    });
    return gl ? new MediaMelter(gl) : null;
  }

  private constructor(gl: WebGLRenderingContext) {
    this.gl = gl;
    this.melting = this.program(FRAGMENT);
    this.mixing = this.program(MIX);
    this.at = this.uniforms(this.melting, [
      'tMedia',
      'uSize',
      'uRest',
      'uShown',
      'uRadii',
      'uMelt',
      'uSeed',
      'uDpr',
      'uStreak',
      'uTime',
    ]);
    this.mixAt = this.uniforms(this.mixing, [
      'tLeaving',
      'tComing',
      'uSize',
      'uDpr',
      'uStir',
      'uComing',
      'uTime',
    ]);
    this.layers = [this.layer(), this.layer()];
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
      gl.STATIC_DRAW,
    );
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
  }

  private program(fragment: string) {
    const { gl } = this;
    const shader = (type: number, source: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, source);
      gl.compileShader(s);
      return s;
    };
    const program = gl.createProgram()!;
    gl.attachShader(program, shader(gl.VERTEX_SHADER, VERTEX));
    gl.attachShader(program, shader(gl.FRAGMENT_SHADER, fragment));
    gl.bindAttribLocation(program, 0, 'position');
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS))
      console.error(gl.getProgramInfoLog(program));
    return program;
  }

  private uniforms(program: WebGLProgram, names: string[]) {
    const { gl } = this;
    return Object.fromEntries(
      names.map((name) => [name, gl.getUniformLocation(program, name)]),
    );
  }

  private layer(): Layer {
    const { gl } = this;
    const texture = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, texture);
    for (const wrap of [gl.TEXTURE_WRAP_S, gl.TEXTURE_WRAP_T])
      gl.texParameteri(gl.TEXTURE_2D, wrap, gl.CLAMP_TO_EDGE);
    for (const filter of [gl.TEXTURE_MIN_FILTER, gl.TEXTURE_MAG_FILTER])
      gl.texParameteri(gl.TEXTURE_2D, filter, gl.LINEAR);
    return { frame: gl.createFramebuffer()!, texture };
  }

  private texture(media: Picture) {
    const { gl } = this;
    const src = media.currentSrc;
    let held = this.textures.get(media);
    if (!held) {
      const texture = gl.createTexture()!;
      gl.bindTexture(gl.TEXTURE_2D, texture);
      for (const wrap of [gl.TEXTURE_WRAP_S, gl.TEXTURE_WRAP_T])
        gl.texParameteri(gl.TEXTURE_2D, wrap, gl.CLAMP_TO_EDGE);
      held = { texture, src: '' };
      this.textures.set(media, held);
    }
    gl.bindTexture(gl.TEXTURE_2D, held.texture);
    const isVideo = media instanceof HTMLVideoElement;
    if (!uploadsAgain(held.src, src, isVideo)) return;
    held.src = src;
    const source = isVideo ? media : squared(media);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
    // A still is smoothed as it shrinks, as the page's own picture is, or the
    // two differ visibly where the picture takes over.
    if (!isVideo) gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(
      gl.TEXTURE_2D,
      gl.TEXTURE_MIN_FILTER,
      isVideo ? gl.LINEAR : gl.LINEAR_MIPMAP_LINEAR,
    );
  }

  // Starts a frame `width` by `height` CSS pixels at `dpr`, both layers clear,
  // at `time` seconds, its streak along `streak` (CSS pixels).
  begin(
    width: number,
    height: number,
    dpr: number,
    time: number,
    streak: number,
  ) {
    const { gl, at, layers } = this;
    const { canvas } = gl;
    const w = Math.round(width * dpr);
    const h = Math.round(height * dpr);
    const resized = canvas.width !== w || canvas.height !== h;
    if (resized) Object.assign(canvas, { width: w, height: h });
    gl.viewport(0, 0, w, h);
    gl.clearColor(0, 0, 0, 0);
    gl.activeTexture(gl.TEXTURE0);
    for (const { frame, texture } of layers) {
      gl.bindTexture(gl.TEXTURE_2D, texture);
      if (resized)
        gl.texImage2D(
          gl.TEXTURE_2D,
          0,
          gl.RGBA,
          w,
          h,
          0,
          gl.RGBA,
          gl.UNSIGNED_BYTE,
          null,
        );
      gl.bindFramebuffer(gl.FRAMEBUFFER, frame);
      if (resized)
        gl.framebufferTexture2D(
          gl.FRAMEBUFFER,
          gl.COLOR_ATTACHMENT0,
          gl.TEXTURE_2D,
          texture,
          0,
        );
      gl.clear(gl.COLOR_BUFFER_BIT);
    }
    gl.useProgram(this.melting);
    gl.enable(gl.BLEND);
    gl.uniform1i(at.tMedia!, 0);
    gl.uniform2f(at.uSize!, w, h);
    gl.uniform1f(at.uDpr!, dpr);
    gl.uniform1f(at.uTime!, time);
    gl.uniform1f(at.uStreak!, streak);
  }

  // Draws from here on go to the layer of pictures going out or coming in.
  drawTo(isComing: boolean) {
    const { gl, layers } = this;
    gl.bindFramebuffer(gl.FRAMEBUFFER, layers[isComing ? 1 : 0].frame);
  }

  // Draws `media` melting toward `rest` (CSS pixels),
  // showing its part `shown`, with corners of `radii` (CSS pixels, as CSS
  // orders them), at `dpr`, its bands set by `seed`.
  draw(
    media: Picture,
    rest: Box,
    shown: [number, number, number, number],
    radii: readonly [number, number, number, number],
    melt: number,
    seed: number,
    dpr: number,
  ) {
    const { gl, at } = this;
    this.texture(media);
    gl.uniform4f(
      at.uRest!,
      rest.x * dpr,
      rest.y * dpr,
      rest.width * dpr,
      rest.height * dpr,
    );
    gl.uniform4f(at.uShown!, ...shown);
    gl.uniform4f(
      at.uRadii!,
      radii[0] * dpr,
      radii[1] * dpr,
      radii[2] * dpr,
      radii[3] * dpr,
    );
    gl.uniform1f(at.uMelt!, melt);
    gl.uniform1f(at.uSeed!, seed);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }

  // Mixes the layers onto the canvas, stirred `stir` (stirOf) by a flow at
  // `time` seconds, the new having spread `coming` (0 to 1) through the old.
  finish(stir: number, coming: number, time: number, dpr: number) {
    const { gl, layers, mixAt } = this;
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.disable(gl.BLEND);
    gl.useProgram(this.mixing);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, layers[1].texture);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, layers[0].texture);
    gl.uniform1i(mixAt.tLeaving!, 0);
    gl.uniform1i(mixAt.tComing!, 1);
    gl.uniform2f(mixAt.uSize!, gl.canvas.width, gl.canvas.height);
    gl.uniform1f(mixAt.uDpr!, dpr);
    gl.uniform1f(mixAt.uStir!, stir);
    gl.uniform1f(mixAt.uComing!, coming);
    gl.uniform1f(mixAt.uTime!, time);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }
}
