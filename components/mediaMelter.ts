import { Box } from './mediaBender';

// Draws a post's picture melting: on its way in it runs in from the window's
// right side as streaks, a band of the picture at a time, and pools into its
// place; on its way out it runs back the same way. The streaks are the
// pointer's bend (mediaBender.ts) made to order, its colours parting the same
// way, but across the picture's whole height rather than along the pointer's
// trail. At `melt` 1 it draws the picture exactly where it rests, so the
// picture itself can take over with no jump, and at 0 it draws nothing.

// How long a picture takes, in seconds, on its way in and out.
export const MELT_IN_S = 1.3;
export const MELT_OUT_S = 0.85;

// How far ahead of each other the bands of a picture go, as a share of the
// melt: more leaves longer streaks.
const SPREAD = 0.75;
// How many times its own width a picture stretches at the height of the melt.
const STRETCH = 2.5;

// Slows to a stop at 1, so run backward it gathers speed from there.
export const easeMelt = (melt: number) => 1 - (1 - melt) ** 3;

// One step of a picture's melt: `melt` after `seconds`, going in (`direction`
// 1) or out (-1).
export function stepMelt(melt: number, direction: 1 | -1, seconds: number) {
  const whole = direction > 0 ? MELT_IN_S : MELT_OUT_S;
  return Math.min(Math.max(melt + (direction * seconds) / whole, 0), 1);
}

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
  varying vec2 vUv;

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
  }

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
    vec2 t = (p - uRest.xy) / uRest.zw;
    // Each band of the picture has its own moment: broad bands that wander
    // up and down along their length, as water runs down glass, with no hard
    // step between one and the next.
    float row = p.y / uDpr;
    row += 50.0 * noise(vec2(p.x / uDpr / 160.0, row / 130.0 + uSeed));
    float band = 0.75 * noise(vec2(row / 70.0, uSeed))
      + 0.25 * noise(vec2(row / 26.0, uSeed + 7.0));
    float melt = clamp(uMelt * (1.0 + ${SPREAD}) - band * ${SPREAD}, 0.0, 1.0);
    float gone = 1.0 - melt;
    gone = gone * gone * (3.0 - 2.0 * gone);
    // The way to the window's right side, in picture widths.
    float far = (uSize.x - uRest.x) / uRest.z;
    float stretch = 1.0 + gone * ${STRETCH};
    float across = (t.x - gone * far) / stretch;
    float sag = noise(vec2(t.x * 2.5 - uMelt * 3.0, row / 90.0 + uSeed)) - 0.5;
    float down = t.y + gone * sag * 0.35;
    vec2 at = vec2(across, down);
    float split = gone * 0.05;
    float soft = uDpr * (0.5 + gone * 24.0);
    float shown = outline(at, soft);
    vec3 colour = vec3(
      picture(at + vec2(split, 0.0)).r,
      picture(at).g,
      picture(at - vec2(split, 0.0)).b);
    gl_FragColor = vec4(colour * shown, shown);
  }`;

// The melt's shared canvas: `canvas` fills the window behind the post cards.
export class MediaMelter {
  private readonly gl: WebGLRenderingContext;
  private readonly textures = new WeakMap<HTMLImageElement, WebGLTexture>();
  private readonly at: Record<string, WebGLUniformLocation | null> = {};

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
    const shader = (type: number, source: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, source);
      gl.compileShader(s);
      return s;
    };
    const program = gl.createProgram()!;
    gl.attachShader(program, shader(gl.VERTEX_SHADER, VERTEX));
    gl.attachShader(program, shader(gl.FRAGMENT_SHADER, FRAGMENT));
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS))
      console.error(gl.getProgramInfoLog(program));
    gl.useProgram(program);
    for (const name of [
      'tMedia',
      'uSize',
      'uRest',
      'uShown',
      'uRadii',
      'uMelt',
      'uSeed',
      'uDpr',
    ])
      this.at[name] = gl.getUniformLocation(program, name);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
      gl.STATIC_DRAW,
    );
    const position = gl.getAttribLocation(program, 'position');
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
  }

  private texture(media: HTMLImageElement) {
    const { gl } = this;
    let texture = this.textures.get(media);
    if (texture) return gl.bindTexture(gl.TEXTURE_2D, texture);
    texture = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, texture);
    for (const wrap of [gl.TEXTURE_WRAP_S, gl.TEXTURE_WRAP_T])
      gl.texParameteri(gl.TEXTURE_2D, wrap, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, media);
    this.textures.set(media, texture);
  }

  // Starts a frame `width` by `height` CSS pixels at `dpr`, cleared.
  begin(width: number, height: number, dpr: number) {
    const { gl, at } = this;
    const { canvas } = gl;
    const w = Math.round(width * dpr);
    const h = Math.round(height * dpr);
    if (canvas.width !== w || canvas.height !== h)
      Object.assign(canvas, { width: w, height: h });
    gl.viewport(0, 0, w, h);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.uniform1i(at.tMedia!, 0);
    gl.uniform2f(at.uSize!, w, h);
    gl.uniform1f(at.uDpr!, dpr);
  }

  // Draws `media` melting (eased by easeMelt) toward `rest` (CSS pixels),
  // showing its part `shown`, with corners of `radii` (CSS pixels, as CSS
  // orders them), at `dpr`, its bands set by `seed`.
  draw(
    media: HTMLImageElement,
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
    gl.uniform1f(at.uMelt!, easeMelt(melt));
    gl.uniform1f(at.uSeed!, seed);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }
}
