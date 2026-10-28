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
import { frost, tint } from './glassLooks';
import {
  AROUND_PX,
  type Glass,
  LIGHT_TINT_LUMINANCE,
  TINT_LUMINANCE,
} from './glassTint';
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
// The glass's tint: on a large screen none (TINT_STRENGTH), so the glass is
// clear but for its frost and lenses, except where it must darken (or
// lighten) for its text: then toward the colour of the sky around the card
// (glassTint.ts's bounds). On a phone, or a screen too short for much text,
// SMALL_STRENGTH of the way to the sky's own colour around the card
// throughout, so the text there stands more on its own and the glass matches
// the sky the footer sits on, then darkened (or lightened) only as far as
// the bounds need. The phone menu (data-glass-deep) goes as far toward
// the tint itself, so its lenses show.
const TINT_STRENGTH = 0;
const SMALL_STRENGTH = 0.75;
// The glass is pressed into small square lenses, like lenslet glass: each
// about CELL_PX across (sized so whole lenses fit the card), and each, as a
// lens does, showing the scene behind it upside down and shrunk: the view
// SPREAD_PX either side of its centre, squeezed into its own half-width.
export const CELL_PX = 14;
export const SPREAD_PX = 20;
// Behind a card's form fields (glassCards.ts's FIELDS) the glass is calmer,
// so what is behind does not distract from what is typed: frosted a little
// harder, to FIELD_FROST_PX, its lenses bending only FIELD_LENS of what the
// card's do; its edge softens over FIELD_FEATHER_PX either side of the
// field's outline.
export const FIELD_FROST_PX = 11;
export const FIELD_LENS = 0.4;
const FIELD_FEATHER_PX = 1.5;

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
    fragmentShader: `
      uniform sampler2D tScene;
      uniform sampler2D tBlur;
      uniform sampler2D tSmooth;
      uniform vec4 uFields[${FIELDS}];
      uniform float uFieldRadius[${FIELDS}];
      uniform int uFieldCount;
      uniform float uCalm;
      uniform float uFieldFeather;
      uniform vec4 uCards[${CARDS}];
      uniform float uLight[${CARDS}];
      uniform float uDeep[${CARDS}];
      uniform vec2 uBounds[${CARDS}];
      uniform float uAround;
      uniform float uStrength;
      // On a small screen every card takes the sky around all of them
      // together (uShared), so the panes stacked down a phone match.
      uniform float uShare;
      uniform vec4 uShared;
      uniform float uRadius[${CARDS}];
      uniform float uReach[${CARDS}];
      uniform float uFaded[${CARDS}];
      uniform float uOpacity[${CARDS}];
      uniform int uCount;
      uniform float uFade[${FADE_SAMPLES}];
      uniform vec2 uSize;
      uniform vec2 uFeather;
      uniform float uCell;
      uniform float uSpread;
      varying vec2 vUv;

      // How much of a rounded box's frosting reaches a point: whole inside
      // and just past its edge, fading out by reach beyond (canvas pixels).
      float inside(vec2 p, vec4 box, float radius, float reach) {
        vec2 centre = (box.xy + box.zw) * 0.5;
        vec2 extent = (box.zw - box.xy) * 0.5 - radius;
        float d = length(max(abs(p - centre) - extent, 0.0)) - radius;
        return 1.0 - smoothstep(uFeather.x, reach, d);
      }

      // The colour of the sky around a card (glassTint.ts), in linear light:
      // the frame read at points on a ring uAround outside it, the brighter
      // half of them (the sky, not the head passing behind) averaged.
      float luma(vec3 c) {
        return dot(c, vec3(0.2126, 0.7152, 0.0722));
      }
      // A ring past the screen's edge is drawn in to it when inside is set, so a
      // box filling the screen still finds the sky.
      vec3 skyAround(vec4 box, bool inside) {
        vec2 low = box.xy - uAround;
        vec2 high = box.zw + uAround;
        if (inside) {
          low = max(low, vec2(0.5));
          high = min(high, uSize - 0.5);
        }
        vec3 seen[16];
        float total = 0.0;
        float count = 0.0;
        for (int k = 0; k < 16; k++) {
          float t = (float(k / 4) + 0.5) / 4.0;
          int side = k - (k / 4) * 4;
          vec2 at = side == 0 ? vec2(mix(low.x, high.x, t), high.y)
            : side == 1 ? vec2(mix(low.x, high.x, t), low.y)
            : side == 2 ? vec2(low.x, mix(low.y, high.y, t))
            : vec2(high.x, mix(low.y, high.y, t));
          vec2 uv = at / uSize;
          bool on = all(greaterThanEqual(uv, vec2(0.0))) && all(lessThanEqual(uv, vec2(1.0)));
          seen[k] = on ? pow(texture2D(tScene, uv).rgb, vec3(2.2)) : vec3(-1.0);
          if (on) {
            total += luma(seen[k]);
            count += 1.0;
          }
        }
        if (count < 1.0) return vec3(0.0);
        float middle = total / count;
        vec3 sum = vec3(0.0);
        float n = 0.0;
        for (int k = 0; k < 16; k++) {
          if (seen[k].r >= 0.0 && luma(seen[k]) >= middle) {
            sum += seen[k];
            n += 1.0;
          }
        }
        return sum / max(n, 1.0);
      }

      // A card's tint, as the frame's own values, from the sky's colour around
      // it (skyAround): darkened on the dark side, lightened if need be on the
      // light side.
      vec3 cardTint(vec3 sky, float lightness) {
        float bright = luma(sky);
        vec3 dark = sky * min(${TINT_LUMINANCE} / max(bright, 0.000001), 1.0);
        vec3 headLight = pow(vec3(237.0, 228.0, 227.0) / 255.0, vec3(2.2));
        float lift = clamp((${LIGHT_TINT_LUMINANCE} - bright) / max(luma(headLight) - bright, 0.0001), 0.0, 1.0);
        vec3 light = mix(sky, headLight, lift);
        return pow(mix(dark, light, lightness), vec3(1.0 / 2.2));
      }

      // Whether a point is in a field's rounded outline, softened across it.
      float inField(vec2 p, vec4 box, float radius) {
        vec2 centre = (box.xy + box.zw) * 0.5;
        vec2 extent = (box.zw - box.xy) * 0.5 - radius;
        float d = length(max(abs(p - centre) - extent, 0.0)) - radius;
        return 1.0 - smoothstep(-uFieldFeather, uFieldFeather, d);
      }

      // Where the glass at p shows the scene from, in canvas pixels: through
      // lenses laid from the box's top left corner, sized so whole lenses fit
      // it, each showing the view about its centre upside down and shrunk.
      vec2 cellOf(vec4 box) {
        vec2 size = box.zw - box.xy;
        return size / max(floor(size / uCell + 0.5), 1.0);
      }
      vec2 lens(vec2 p, vec4 box) {
        vec2 cell = cellOf(box);
        vec2 q = (p - box.xw) / cell;
        vec2 centre = box.xw + (floor(q) + 0.5) * cell;
        return centre - (fract(q) * 2.0 - 1.0) * uSpread;
      }

      void main() {
        vec4 scene = texture2D(tScene, vUv);
        vec2 p = vUv * uSize;
        float at = (1.0 - vUv.y) * ${(FADE_SAMPLES - 1).toFixed(1)};
        int k = int(floor(at));
        float fade = mix(uFade[k], uFade[min(k + 1, ${FADE_SAMPLES - 1})], fract(at));
        float frost = 0.0;
        vec4 box = vec4(0.0, 0.0, 1.0, 1.0);
        float lightness = 0.0;
        float deep = 0.0;
        vec2 bounds = vec2(0.0, 1.0);
        for (int i = 0; i < ${CARDS}; i++) {
          if (i >= uCount) break;
          float shown = mix(1.0, fade, uFaded[i]) * uOpacity[i];
          float here = inside(p, uCards[i], uRadius[i], uReach[i]) * shown;
          // The menu's pane wins over the footer's.
          if (here > frost || (uDeep[i] > 0.5 && here > 0.0 && here >= frost)) {
            frost = here;
            box = uCards[i];
            lightness = uLight[i];
            deep = uDeep[i];
            bounds = uBounds[i];
          }
        }
        // On a small screen the whole card is as calm as a field.
        float field = uCalm;
        for (int i = 0; i < ${FIELDS}; i++) {
          if (i >= uFieldCount) break;
          field = max(field, inField(p, uFields[i], uFieldRadius[i]));
        }
        // How much of a lens the glass is here: less behind a field.
        float lensed = frost * mix(1.0, ${FIELD_LENS.toFixed(2)}, field);
        ${mode === 'frost' ? frost : tint}
      }`,
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

// Tints the cards' glass, after the colour grading, so the tint is the
// head's darkest colour as the page shows it (a pass after Grading.tsx's
// LUT), with the frosting's soft outline (from `glass`).
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
