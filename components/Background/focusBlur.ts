import {
  Camera,
  Color,
  CustomBlending,
  OneFactor,
  OneMinusSrcAlphaFactor,
  Scene,
  ShaderMaterial,
  UniformsUtils,
  WebGLRenderer,
  WebGLRenderTarget,
} from 'three';
import { FullScreenQuad, Pass } from 'three/addons/postprocessing/Pass.js';
import { CopyShader } from 'three/addons/shaders/CopyShader.js';

// While a field of a form marked `data-focus-blur` (the contact form) has
// focus, or a video marked it is playing (the 404 page's, a post's video
// tile: each marks itself `data-playing` then), the scene behind it blurs
// softly, inside the scene's own drawing
// (Grading.tsx) rather than as a CSS filter on the canvas: so the 3D titles
// (the home page's name, the header's page title; TitleName.tsx) are drawn
// sharp on top of the blur, and the blur runs clean to the screen's edges.

// The titles' layer: the scene's first drawing leaves them out, and
// TitlePass draws them over whatever the passes before it made of the rest.
export const TITLE_LAYER = 1;

// How strong the blur is (its standard deviation, in CSS pixels), and how
// long it takes to come and go, in seconds.
export const FOCUS_BLUR_PX = 6;
export const FOCUS_BLUR_SECONDS = 0.3;

export const formFocused = () =>
  document.querySelector(
    'form[data-focus-blur]:focus-within, [data-focus-blur][data-playing]',
  ) !== null;

// Whether the phone menu is open (components/Header/MobileNav): its glass
// panel covers the page, so the 3D titles are not drawn over it.
export const menuOpen = () =>
  document.querySelector('.mobile-menu.fixed') !== null;

// Whether its glass is on screen: open, or fading away as it closes.
export const menuShown = () =>
  document.querySelector('.mobile-menu:not(.hidden)') !== null;

// Draws the titles' layer over the frame so far, without the sky behind it,
// with the scene and camera `world` gives as it draws (the camera can change
// after the pass is made). With `samples` (quality.ts's titleSamples: where
// the frame itself is not smoothed), the titles are drawn smoothed into a
// target of their own, then laid over the frame: the letters' coverage at
// their edges, cleared to nothing around them, is their alpha.
export class TitlePass extends Pass {
  private readonly world: () => { scene: Scene; camera: Camera };
  samples = 0;
  private smoothed?: WebGLRenderTarget;
  private readonly over = new FullScreenQuad(
    new ShaderMaterial({
      ...CopyShader,
      uniforms: UniformsUtils.clone(CopyShader.uniforms),
      blending: CustomBlending,
      blendSrc: OneFactor,
      blendDst: OneMinusSrcAlphaFactor,
      depthTest: false,
      depthWrite: false,
    }),
  );
  private readonly clearColour = new Color();

  constructor(world: () => { scene: Scene; camera: Camera }) {
    super();
    this.world = world;
    this.needsSwap = false;
  }

  render(
    renderer: WebGLRenderer,
    _writeBuffer: WebGLRenderTarget,
    readBuffer: WebGLRenderTarget,
  ) {
    const { scene, camera } = this.world();
    const background = scene.background;
    const layers = camera.layers.mask;
    const autoClear = renderer.autoClear;
    scene.background = null;
    camera.layers.set(TITLE_LAYER);
    renderer.autoClear = false;
    const out = this.renderToScreen ? null : readBuffer;
    if (this.samples > 0) {
      const target = this.target(readBuffer);
      const alpha = renderer.getClearAlpha();
      renderer.getClearColor(this.clearColour);
      renderer.setClearColor(0x000000, 0);
      renderer.setRenderTarget(target);
      renderer.clear();
      renderer.render(scene, camera);
      renderer.setClearColor(this.clearColour, alpha);
      renderer.setRenderTarget(out);
      (this.over.material as ShaderMaterial).uniforms.tDiffuse!.value =
        target.texture;
      this.over.render(renderer);
    } else {
      // Smoothing dropped (the scene found it draws in software): its target
      // goes with it.
      this.smoothed?.dispose();
      this.smoothed = undefined;
      renderer.setRenderTarget(out);
      // The blur's full-screen passes leave their own depth behind; the
      // titles sit in front of the whole scene, so they are drawn over it
      // regardless.
      renderer.clearDepth();
      renderer.render(scene, camera);
    }
    scene.background = background;
    camera.layers.mask = layers;
    renderer.autoClear = autoClear;
  }

  // The titles' own smoothed target, the frame's size and kind.
  private target(frame: WebGLRenderTarget) {
    this.smoothed ??= new WebGLRenderTarget(1, 1, {
      type: frame.texture.type,
      samples: this.samples,
    });
    if (
      this.smoothed.width !== frame.width ||
      this.smoothed.height !== frame.height
    )
      this.smoothed.setSize(frame.width, frame.height);
    return this.smoothed;
  }

  dispose() {
    this.smoothed?.dispose();
    this.over.material.dispose();
    this.over.dispose();
  }
}
