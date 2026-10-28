import {
  HalfFloatType,
  ShaderMaterial,
  Vector2,
  WebGLRenderer,
  WebGLRenderTarget,
} from 'three';
import { FullScreenQuad, Pass } from 'three/addons/postprocessing/Pass.js';

import { inkLeft, TRAIL_RADIUS_PX, trailShows } from '@/components/pointerInk';

import { CELL_PX, SPREAD_PX } from './glass';

// The pointer leaves a trail through the 3D scene (the sky, the head and the
// 3D titles; not the page over them, whose images and videos bend instead:
// MediaBend.tsx): where it passes, the scene shows faintly through the
// cards' square glass lenses (glass.ts). The trail has no edge: it is ink
// laid along the pointer's path (pointerInk.ts) into a small offscreen
// picture, soft at its rim, spreading a little and fading every frame, so it
// comes and goes like breath on glass.

// Gentler than the cards' glass: at the trail's heart it shows at most
// LENS_MIX of the lensed view over the scene, its lenses bending only
// LENS_SPREAD of what the cards' do, and it fades in over the whole depth of
// the ink, so its rim melts away.
const LENS_MIX = 0.45;
const LENS_SPREAD = 0.5;
// The ink spreads to its neighbours this much a frame, softening its rim.
const SPREAD = 0.35;
// The ink picture is this many times smaller than the canvas.
const INK_SCALE = 6;

// Lays ink along the pointer's path since the last frame, spreads it and
// fades it.
const ink = () =>
  new ShaderMaterial({
    uniforms: {
      tInk: { value: null },
      uTexel: { value: new Vector2() },
      uSize: { value: new Vector2(1, 1) },
      uFrom: { value: new Vector2() },
      uTo: { value: new Vector2() },
      uRadius: { value: 1 },
      uInk: { value: 0 },
      uKeep: { value: 1 },
      uSpread: { value: SPREAD },
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }`,
    fragmentShader: `
      uniform sampler2D tInk;
      uniform vec2 uTexel;
      uniform vec2 uSize;
      uniform vec2 uFrom;
      uniform vec2 uTo;
      uniform float uRadius;
      uniform float uInk;
      uniform float uKeep;
      uniform float uSpread;
      varying vec2 vUv;

      float toPath(vec2 p, vec2 a, vec2 b) {
        vec2 ab = b - a;
        float t = clamp(dot(p - a, ab) / max(dot(ab, ab), 0.0001), 0.0, 1.0);
        return length(p - a - ab * t);
      }

      void main() {
        float here = texture2D(tInk, vUv).r;
        float around = (
          texture2D(tInk, vUv + vec2(uTexel.x, 0.0)).r +
          texture2D(tInk, vUv - vec2(uTexel.x, 0.0)).r +
          texture2D(tInk, vUv + vec2(0.0, uTexel.y)).r +
          texture2D(tInk, vUv - vec2(0.0, uTexel.y)).r) * 0.25;
        float ink = mix(here, around, uSpread);
        float near = 1.0 - smoothstep(0.0, uRadius, toPath(vUv * uSize, uFrom, uTo));
        ink = max(ink, near * near * uInk);
        gl_FragColor = vec4(ink * uKeep, 0.0, 0.0, 1.0);
      }`,
  });

// Draws the frame through lenses as much as the ink there, which fades out
// softly.
const show = () =>
  new ShaderMaterial({
    uniforms: {
      tDiffuse: { value: null },
      tInk: { value: null },
      uSize: { value: new Vector2(1, 1) },
      uCell: { value: CELL_PX },
      uSpread: { value: SPREAD_PX },
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }`,
    fragmentShader: `
      uniform sampler2D tDiffuse;
      uniform sampler2D tInk;
      uniform vec2 uSize;
      uniform float uCell;
      uniform float uSpread;
      varying vec2 vUv;

      void main() {
        vec4 scene = texture2D(tDiffuse, vUv);
        // Square lenses on a grid fixed to the window, each showing the view
        // about its centre upside down and shrunk, as the cards' do.
        vec2 q = vUv * uSize / uCell;
        vec2 from = (floor(q) + 0.5) * uCell - (fract(q) * 2.0 - 1.0) * uSpread;
        float soft = smoothstep(0.0, 1.0, texture2D(tInk, vUv).r) * ${LENS_MIX.toFixed(2)};
        gl_FragColor = vec4(mix(scene.rgb, texture2D(tDiffuse, from / uSize).rgb, soft), scene.a);
      }`,
  });

export class TrailPass extends Pass {
  // The pointer, in CSS pixels from the window's top left, as it is and as it
  // was when the ink was last laid; null before it first moves.
  private pointer: { x: number; y: number } | null = null;
  private laid: { x: number; y: number } | null = null;
  private moved = -Infinity;
  private last = 0;
  private readonly targets = [0, 1].map(
    () => new WebGLRenderTarget(1, 1, { type: HalfFloatType }),
  );
  private readonly inker = new FullScreenQuad(ink());
  private readonly shower = new FullScreenQuad(show());

  // The pointer moved to (`x`, `y`), in CSS pixels from the window's top left.
  move(x: number, y: number) {
    this.pointer = { x, y };
    this.moved = performance.now();
  }

  render(
    renderer: WebGLRenderer,
    writeBuffer: WebGLRenderTarget,
    readBuffer: WebGLRenderTarget,
  ) {
    const now = performance.now();
    const seconds = Math.min((now - this.last) / 1000, 0.1);
    this.last = now;
    // Once the trail has faded, the frame passes on as it is.
    this.needsSwap =
      this.pointer !== null && trailShows((now - this.moved) / 1000);
    if (!this.needsSwap || !this.pointer) {
      this.laid = null;
      return;
    }
    const canvas = renderer.domElement.getBoundingClientRect();
    const dpr = readBuffer.width / (canvas.width || 1);
    // Canvas pixels, from the bottom left as the shaders count them.
    const toCanvas = ({ x, y }: { x: number; y: number }) =>
      new Vector2((x - canvas.left) * dpr, (canvas.bottom - y) * dpr);
    const to = toCanvas(this.pointer);
    const from = this.laid ? toCanvas(this.laid) : to;
    const moving = !this.laid || this.laid !== this.pointer;
    this.laid = this.pointer;

    const [read, write] = this.targets as [
      WebGLRenderTarget,
      WebGLRenderTarget,
    ];
    const width = Math.max(1, Math.ceil(readBuffer.width / INK_SCALE));
    const height = Math.max(1, Math.ceil(readBuffer.height / INK_SCALE));
    if (read.width !== width || read.height !== height)
      for (const target of this.targets) target.setSize(width, height);
    const u = (this.inker.material as ShaderMaterial).uniforms;
    u.tInk!.value = read.texture;
    u.uTexel!.value.set(1 / width, 1 / height);
    u.uSize!.value.set(readBuffer.width, readBuffer.height);
    u.uFrom!.value.copy(from);
    u.uTo!.value.copy(to);
    u.uRadius!.value = TRAIL_RADIUS_PX * dpr;
    u.uInk!.value = moving ? 1 : 0;
    u.uKeep!.value = inkLeft(seconds);
    renderer.setRenderTarget(write);
    this.inker.render(renderer);
    this.targets.reverse();

    const s = (this.shower.material as ShaderMaterial).uniforms;
    s.tDiffuse!.value = readBuffer.texture;
    s.tInk!.value = write.texture;
    s.uSize!.value.set(readBuffer.width, readBuffer.height);
    s.uCell!.value = CELL_PX * dpr;
    s.uSpread!.value = SPREAD_PX * LENS_SPREAD * dpr;
    renderer.setRenderTarget(this.renderToScreen ? null : writeBuffer);
    this.shower.render(renderer);
  }

  dispose() {
    for (const target of this.targets) target.dispose();
    this.inker.dispose();
    this.shower.dispose();
  }
}
