import { Mark, PATH_MARKS, TRAIL_RADIUS_PX } from './pointerInk';

// Draws an image or video bent by the pointer's trail (MediaBend.tsx), with
// one WebGL context shared by every picture: where the trail's ink lies, the
// picture bends a little toward the pointer and its colours part at the
// edges, fading out softly with the ink, as tamasolajos.com's mouse effect
// does. Outside the ink it draws nothing, so the picture itself shows.

// How far a picture bends toward the pointer at the trail's heart, in CSS
// pixels, and the distance from the pointer within which the bend eases off
// (so the pointer itself does not pinch).
const BEND_PX = 20;
const BEND_EASE_PX = 60;

export type Box = { x: number; y: number; width: number; height: number };

// The part of a picture `natural` in size that shows in its box, as
// [left, top, width, height] in shares of the picture: all of it, or for
// `object-fit: cover` the middle of it, cropped to the box's shape.
export function shownPart(
  box: { width: number; height: number },
  natural: { width: number; height: number },
  fit: string,
): [number, number, number, number] {
  if (fit !== 'cover' || !natural.width || !natural.height) return [0, 0, 1, 1];
  const scale = Math.max(
    box.width / natural.width,
    box.height / natural.height,
  );
  const width = box.width / scale / natural.width;
  const height = box.height / scale / natural.height;
  return [(1 - width) / 2, (1 - height) / 2, width, height];
}

// Whether a picture's texture is uploaded again: when its source changes,
// and every frame for a video, so it keeps playing under the bend.
export const uploadsAgain = (was: string, src: string, isVideo: boolean) =>
  was !== src || isVideo;

// Whether a picture can be bent. Not an animated GIF: a page reading an
// animated image (WebGL's texImage2D, as a canvas's drawImage) only ever gets
// its first frame (the HTML standard's rule for animated images), so under
// the bend it would freeze; left alone it keeps moving.
export const bendable = (src: string) => !/\.gif\b/i.test(src);

const VERTEX = `
  attribute vec2 position;
  varying vec2 vUv;
  void main() {
    // From the top left, as the page counts.
    vUv = vec2(position.x * 0.5 + 0.5, 0.5 - position.y * 0.5);
    gl_Position = vec4(position, 0.0, 1.0);
  }`;

const FRAGMENT = `
  precision mediump float;
  uniform sampler2D tMedia;
  uniform vec2 uSize;
  uniform vec4 uMedia;
  uniform vec4 uShown;
  uniform vec2 uPointer;
  uniform vec3 uMarks[${PATH_MARKS}];
  uniform int uCount;
  uniform float uRadius;
  uniform float uBend;
  uniform float uEase;
  varying vec2 vUv;

  float toPath(vec2 p, vec2 a, vec2 b) {
    vec2 ab = b - a;
    float t = clamp(dot(p - a, ab) / max(dot(ab, ab), 0.0001), 0.0, 1.0);
    return length(p - a - ab * t);
  }

  vec4 picture(vec2 p) {
    return texture2D(tMedia, uShown.xy + (p - uMedia.xy) / uMedia.zw * uShown.zw);
  }

  void main() {
    vec2 p = vUv * uSize;
    // The ink: along each step of the path, as much as is left of it.
    float near = 1.0 - smoothstep(0.0, uRadius, length(p - uMarks[0].xy));
    float ink = near * near * uMarks[0].z;
    for (int i = 1; i < ${PATH_MARKS}; i++) {
      if (i >= uCount) break;
      near = 1.0 - smoothstep(0.0, uRadius, toPath(p, uMarks[i - 1].xy, uMarks[i].xy));
      ink = max(ink, near * near * uMarks[i].z);
    }
    float amount = smoothstep(0.0, 0.6, ink);
    vec2 toward = uPointer - p;
    vec2 bend = toward / (length(toward) + uEase) * uBend * amount;
    vec2 split = bend * 0.3;
    vec2 inside = step(uMedia.xy, p) * step(p, uMedia.xy + uMedia.zw);
    float shown = clamp(amount * 4.0, 0.0, 1.0) * inside.x * inside.y;
    vec3 colour = vec3(
      picture(p + bend + split).r,
      picture(p + bend).g,
      picture(p + bend - split).b);
    gl_FragColor = vec4(colour * shown, shown);
  }`;

export class MediaBender {
  private readonly canvas = document.createElement('canvas');
  private readonly gl: WebGLRenderingContext;
  private readonly textures = new WeakMap<
    HTMLImageElement | HTMLVideoElement,
    { texture: WebGLTexture; src: string }
  >();
  private readonly at: Record<string, WebGLUniformLocation | null> = {};

  constructor() {
    const gl = this.canvas.getContext('webgl', {
      premultipliedAlpha: true,
      preserveDrawingBuffer: true,
    })!;
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
      'uMedia',
      'uShown',
      'uPointer',
      'uMarks',
      'uCount',
      'uRadius',
      'uBend',
      'uEase',
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
  }

  // The picture's texture (uploadsAgain says when it is uploaded).
  private texture(media: HTMLImageElement | HTMLVideoElement) {
    const { gl } = this;
    const src = media.currentSrc;
    let held = this.textures.get(media);
    if (!held) {
      const texture = gl.createTexture()!;
      gl.bindTexture(gl.TEXTURE_2D, texture);
      for (const wrap of [gl.TEXTURE_WRAP_S, gl.TEXTURE_WRAP_T])
        gl.texParameteri(gl.TEXTURE_2D, wrap, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      held = { texture, src: '' };
      this.textures.set(media, held);
    }
    gl.bindTexture(gl.TEXTURE_2D, held.texture);
    if (uploadsAgain(held.src, src, media instanceof HTMLVideoElement)) {
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        media,
      );
      held.src = src;
    }
  }

  // Draws `media`, sitting at `box` in `overlay` (both in the overlay's CSS
  // pixels), bent by `path` (in the overlay's CSS pixels, each mark with the
  // share of its ink left) toward `pointer`, into `overlay` at `dpr`.
  draw(
    overlay: HTMLCanvasElement,
    media: HTMLImageElement | HTMLVideoElement,
    box: Box,
    shown: [number, number, number, number],
    path: (Mark & { left: number })[],
    pointer: { x: number; y: number },
    dpr: number,
  ) {
    const { gl, canvas, at } = this;
    const width = overlay.width;
    const height = overlay.height;
    if (canvas.width < width) canvas.width = width;
    if (canvas.height < height) canvas.height = height;
    gl.viewport(0, canvas.height - height, width, height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    this.texture(media);
    gl.uniform1i(at.tMedia!, 0);
    gl.uniform2f(at.uSize!, width, height);
    gl.uniform4f(
      at.uMedia!,
      box.x * dpr,
      box.y * dpr,
      box.width * dpr,
      box.height * dpr,
    );
    gl.uniform4f(at.uShown!, ...shown);
    gl.uniform2f(at.uPointer!, pointer.x * dpr, pointer.y * dpr);
    gl.uniform3fv(
      at.uMarks!,
      path.flatMap(({ x, y, left }) => [x * dpr, y * dpr, left]),
    );
    gl.uniform1i(at.uCount!, path.length);
    gl.uniform1f(at.uRadius!, TRAIL_RADIUS_PX * dpr);
    gl.uniform1f(at.uBend!, BEND_PX * dpr);
    gl.uniform1f(at.uEase!, BEND_EASE_PX * dpr);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    const context = overlay.getContext('2d')!;
    context.clearRect(0, 0, width, height);
    context.drawImage(canvas, 0, 0, width, height, 0, 0, width, height);
  }
}
