import {
  HalfFloatType,
  ShaderMaterial,
  Texture,
  UniformsUtils,
  Vector2,
  Vector4,
  WebGLRenderer,
  WebGLRenderTarget,
} from 'three';
import { FullScreenQuad, Pass } from 'three/addons/postprocessing/Pass.js';
import { HorizontalBlurShader } from 'three/addons/shaders/HorizontalBlurShader.js';
import { VerticalBlurShader } from 'three/addons/shaders/VerticalBlurShader.js';

import { type Card, CARDS, FADE_SAMPLES, FIELDS, NEAR_TO } from './glassCards';
import { compositeShader } from './glassShader';
import { AROUND_PX, type Glass } from './glassTint';
import { isSmall } from './smallScreen';

// The cards (every `section`, and anything marked `data-glass`) are frosted
// glass: the 3D scene behind each is drawn blurred and tinted, inside the
// card's rounded outline, both fading out softly across its edge (the card
// itself has no background of its own; styles/globals.css).
// CSS backdrop-filter cannot do this here: the page scrolls in a masked box
// (components/PageScroller), and a mask stops a backdrop-filter inside it
// from seeing the canvas behind. So the blur is drawn in the scene (a pass
// of Grading.tsx), fading as the page does under the header and footer.

// How strong the frosting is: its blur's standard deviation in CSS pixels,
// drawn at half resolution in two rounds of three's nine-sample blur.
export const FROST_PX = 6;
const BLUR_STEPS = 2.7;
const ROUNDS = 2;
// The frosting and tint fade out across a card's edge rather than stopping at
// it: whole up to FEATHER_FROM inside the edge, gone by FEATHER_TO outside it
// (CSS pixels; NEAR_TO for a small pane, glassCards.ts). Cards' padding (24px
// at least) keeps their text on the whole tint.
export const FEATHER_FROM = -24;
export const FEATHER_TO = 160;
// The phone menu's tint (data-glass-deep; the cards have none): on a large
// screen none (TINT_STRENGTH) but as far as it must go for its text, within
// glassTint.ts's bounds; on a phone, or a screen too short for much text,
// SMALL_STRENGTH of the way to the tint throughout, so its lenses show.
const TINT_STRENGTH = 0;
const SMALL_STRENGTH = 0.75;
// The glass is pressed into small square lenses, like lenslet glass: each
// about CELL_PX across (sized so whole lenses fit the card), and each, as a
// lens does, showing the scene behind it upside down and shrunk: the view
// SPREAD_PX either side of its centre, squeezed into its own half-width.
export const CELL_PX = 14;
export const SPREAD_PX = 20;
// Behind a card's form fields and paragraphs (glassCards.ts's FIELDS) the
// glass is calmer, so what is behind does not distract from what is typed
// or read: frosted a little harder, to FIELD_FROST_PX, its lenses bending
// only FIELD_LENS of what the card's do; its edge softens over
// FIELD_FEATHER_PX either side of the outline, so it shows as no box.
export const FIELD_FROST_PX = 11;
export const FIELD_LENS = 0.4;
const FIELD_FEATHER_PX = 12;

// How strongly the glass is tinted on a window `width` by `height`.
export const tintStrength = (width: number, height: number) =>
  isSmall(width, height) ? SMALL_STRENGTH : TINT_STRENGTH;

const blur = (shader: {
  uniforms: Record<string, { value: unknown }>;
  vertexShader: string;
  fragmentShader: string;
}) =>
  new ShaderMaterial({
    ...shader,
    uniforms: UniformsUtils.clone(shader.uniforms),
  });

// Mixes the frame with, inside the cards' soft outlines, the blurred frame
// (`frost`) or the tint (`tint`), through the glass's lenses.
const composite = (mode: 'frost' | 'tint') =>
  new ShaderMaterial({
    uniforms: {
      tScene: { value: null },
      tBlur: { value: null },
      tSmooth: { value: null },
      uFields: { value: Array.from({ length: FIELDS }, () => new Vector4()) },
      uFieldRadius: { value: Array<number>(FIELDS).fill(0) },
      uFieldCount: { value: 0 },
      uCalm: { value: 0 },
      uFieldFeather: { value: FIELD_FEATHER_PX },
      uCards: { value: Array.from({ length: CARDS }, () => new Vector4()) },
      uLight: { value: Array<number>(CARDS).fill(0) },
      uDeep: { value: Array<number>(CARDS).fill(0) },
      uAround: { value: AROUND_PX },
      uBounds: {
        value: Array.from({ length: CARDS }, () => new Vector2(0, 1)),
      },
      uStrength: { value: TINT_STRENGTH },
      uShare: { value: 0 },
      uShared: { value: new Vector4() },
      uRadius: { value: Array<number>(CARDS).fill(0) },
      uReach: { value: Array<number>(CARDS).fill(FEATHER_TO) },
      uFaded: { value: Array<number>(CARDS).fill(0) },
      uOpacity: { value: Array<number>(CARDS).fill(1) },
      uCount: { value: 0 },
      uFade: { value: Array<number>(FADE_SAMPLES).fill(1) },
      uSize: { value: new Vector2(1, 1) },
      uFeather: { value: new Vector2(FEATHER_FROM, FEATHER_TO) },
      uCell: { value: CELL_PX },
      uSpread: { value: SPREAD_PX },
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }`,
    fragmentShader: compositeShader(mode, FIELD_LENS),
  });

// Points a composite's uniforms at the frame and the cards as they are.
function setCards(
  material: ShaderMaterial,
  readBuffer: WebGLRenderTarget,
  dpr: number,
  cards: Card[],
  fields: Card[],
  fade: number[],
) {
  const u = material.uniforms;
  u.uFieldFeather!.value = FIELD_FEATHER_PX * dpr;
  u.uFieldCount!.value = fields.length;
  fields.forEach(({ box, radius }, k) => {
    u.uFields!.value[k].copy(box);
    u.uFieldRadius!.value[k] = radius;
  });
  u.tScene!.value = readBuffer.texture;
  u.uSize!.value.set(readBuffer.width, readBuffer.height);
  u.uFeather!.value.set(FEATHER_FROM * dpr, FEATHER_TO * dpr);
  u.uCell!.value = CELL_PX * dpr;
  u.uSpread!.value = SPREAD_PX * dpr;
  u.uCount!.value = cards.length;
  cards.forEach(({ box, radius, faded, opacity, near }, k) => {
    u.uCards!.value[k].copy(box);
    u.uRadius!.value[k] = radius;
    u.uReach!.value[k] = (near ? NEAR_TO : FEATHER_TO) * dpr;
    u.uFaded!.value[k] = faded ? 1 : 0;
    u.uOpacity!.value[k] = opacity;
  });
  if (fade.length) u.uFade!.value = fade;
}

const dprOf = (renderer: WebGLRenderer, target: WebGLRenderTarget) =>
  target.width / renderer.domElement.clientWidth || 1;

export class GlassPass extends Pass {
  cards: Card[] = [];
  fields: Card[] = [];
  // Whether the whole of each card is calmed like a field (small screens).
  calm = false;
  fade: number[] = [];
  private readonly targets = [0, 1, 2].map(
    () => new WebGLRenderTarget(1, 1, { type: HalfFloatType }),
  );
  private readonly across = new FullScreenQuad(blur(HorizontalBlurShader));
  private readonly down = new FullScreenQuad(blur(VerticalBlurShader));
  private readonly mix = new FullScreenQuad(composite('frost'));

  // Blurs `source` by `px` (its standard deviation, in canvas pixels) into
  // `out`, through `scratch`, both half-size targets.
  private blur(
    renderer: WebGLRenderer,
    source: Texture,
    px: number,
    scratch: WebGLRenderTarget,
    out: WebGLRenderTarget,
  ) {
    // The blur's spacing, in the half-size targets' own pixels.
    const spacing = px / 2 / BLUR_STEPS / Math.sqrt(ROUNDS);
    const across = this.across.material as ShaderMaterial;
    const down = this.down.material as ShaderMaterial;
    across.uniforms.h!.value = spacing / out.width;
    down.uniforms.v!.value = spacing / out.height;
    for (let round = 0; round < ROUNDS; round++) {
      across.uniforms.tDiffuse!.value = round ? out.texture : source;
      renderer.setRenderTarget(scratch);
      this.across.render(renderer);
      down.uniforms.tDiffuse!.value = scratch.texture;
      renderer.setRenderTarget(out);
      this.down.render(renderer);
    }
  }

  render(
    renderer: WebGLRenderer,
    writeBuffer: WebGLRenderTarget,
    readBuffer: WebGLRenderTarget,
  ) {
    // With no card on screen, the frame passes on as it is.
    this.needsSwap = this.cards.length > 0;
    if (!this.needsSwap) return;
    const [scratch, frosted, smooth] = this.targets as [
      WebGLRenderTarget,
      WebGLRenderTarget,
      WebGLRenderTarget,
    ];
    const width = Math.max(1, Math.floor(readBuffer.width / 2));
    const height = Math.max(1, Math.floor(readBuffer.height / 2));
    if (scratch.width !== width || scratch.height !== height)
      for (const target of this.targets) target.setSize(width, height);
    const dpr = dprOf(renderer, readBuffer);
    this.blur(renderer, readBuffer.texture, FROST_PX * dpr, scratch, frosted);
    // The fields' harder frost: the card's, blurred on by what it lacks.
    if (this.fields.length || this.calm)
      this.blur(
        renderer,
        frosted.texture,
        Math.sqrt(FIELD_FROST_PX ** 2 - FROST_PX ** 2) * dpr,
        scratch,
        smooth,
      );
    const mix = this.mix.material as ShaderMaterial;
    setCards(mix, readBuffer, dpr, this.cards, this.fields, this.fade);
    mix.uniforms.uCalm!.value = this.calm ? 1 : 0;
    mix.uniforms.tBlur!.value = frosted.texture;
    mix.uniforms.tSmooth!.value = smooth.texture;
    renderer.setRenderTarget(this.renderToScreen ? null : writeBuffer);
    this.mix.render(renderer);
  }

  dispose() {
    for (const target of this.targets) target.dispose();
    this.across.dispose();
    this.down.dispose();
    this.mix.dispose();
  }
}

// Tints the phone menu's glass (data-glass-deep) and no other, however a card
// arriving as the menu fades lies over it, after the colour grading, so the
// tint is the head's darkest colour as the page shows it (a pass after
// Grading.tsx's LUT), with the frosting's soft outline (from `glass`).
export class GlassTintPass extends Pass {
  // Each card's glass, in the order of the glass's cards (glassTint.ts),
  // and how strongly its tint is laid on (tintStrength).
  glasses: Glass[] = [];
  strength = TINT_STRENGTH;
  private readonly glass: GlassPass;
  private readonly tint = new FullScreenQuad(composite('tint'));

  constructor(glass: GlassPass) {
    super();
    this.glass = glass;
  }

  render(
    renderer: WebGLRenderer,
    writeBuffer: WebGLRenderTarget,
    readBuffer: WebGLRenderTarget,
  ) {
    const { cards, fields, fade } = this.glass;
    // With no card on screen, the frame passes on as it is, unless this is
    // the last pass, which must still draw it to the screen.
    this.needsSwap = cards.length > 0;
    if (!this.needsSwap && !this.renderToScreen) return;
    const material = this.tint.material as ShaderMaterial;
    const dpr = dprOf(renderer, readBuffer);
    setCards(material, readBuffer, dpr, cards, fields, fade);
    this.glasses.forEach(({ light, bounds }, k) => {
      material.uniforms.uLight!.value[k] = light;
      material.uniforms.uBounds!.value[k].set(...bounds);
    });
    const deep = material.uniforms.uDeep!.value as number[];
    cards.forEach(({ element }, k) => {
      deep[k] = element.hasAttribute('data-glass-deep') ? 1 : 0;
    });
    material.uniforms.uAround!.value = AROUND_PX * dpr;
    material.uniforms.uStrength!.value = this.strength;
    // On a small screen (the canvas fills the window), one sky for all.
    const { clientWidth, clientHeight } = renderer.domElement;
    const share = isSmall(clientWidth, clientHeight);
    material.uniforms.uShare!.value = share ? 1 : 0;
    if (share) {
      const all = material.uniforms.uShared!.value as Vector4;
      all.set(Infinity, Infinity, -Infinity, -Infinity);
      for (const { box } of cards)
        all.set(
          Math.min(all.x, box.x),
          Math.min(all.y, box.y),
          Math.max(all.z, box.z),
          Math.max(all.w, box.w),
        );
    }
    renderer.setRenderTarget(this.renderToScreen ? null : writeBuffer);
    this.tint.render(renderer);
  }

  dispose() {
    this.tint.dispose();
  }
}
