import { CARDS, FADE_SAMPLES, FIELDS } from './glassCards';
import { LIGHT_TINT_LUMINANCE, TINT_LUMINANCE } from './glassTint';

// The frost's own functions: whether a point is in a field, and the lenses.
const FROST = `
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
`;

// The frost's end of main(): the fields calm the lenses, and the frosted
// scene, seen through them, is laid over the frame.
const frostEnd = (fieldLens: number) => `
        // On a small screen the whole card is as calm as a field.
        float field = uCalm;
        for (int i = 0; i < ${FIELDS}; i++) {
          if (i >= uFieldCount) break;
          field = max(field, inField(p, uFields[i], uFieldRadius[i]));
        }
        // How much of a lens the glass is here: less behind a field.
        float lensed = frost * mix(1.0, ${fieldLens.toFixed(2)}, field);
        vec2 bent = mix(p, lens(p, box), lensed) / uSize;
        vec4 glass = mix(texture2D(tBlur, bent), texture2D(tSmooth, bent), field);
        gl_FragColor = mix(scene, glass, frost);`;

// The tint's own functions: the sky around a card and the tint made from it.
const TINT = `
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
`;

// The tint's end of main(): the card's tint, laid on as strongly as its text
// needs.
const TINT_END = `
        if (frost < 0.001) {
          gl_FragColor = scene;
          return;
        }
        vec3 sky = uShare > 0.5 ? skyAround(uShared, true) : skyAround(box, false);
        vec3 tintColour = cardTint(sky, lightness);
        vec3 weights = vec3(0.2126, 0.7152, 0.0722);
        float tinted = pow(dot(pow(tintColour, vec3(2.2)), weights), 1.0 / 2.2);
        float here = pow(dot(pow(scene.rgb, vec3(2.2)), weights), 1.0 / 2.2);
        float want = clamp(here, bounds.x, bounds.y);
        float apart = here - tinted;
        float shift = abs(apart) < 0.0001 ? 0.0 : clamp((here - want) / apart, 0.0, 1.0);
        gl_FragColor = vec4(mix(scene.rgb, tintColour, max(uStrength, shift) * frost), scene.a);`;

// The fragment shader of the glass's composite pass (glass.ts), in one of
// its two looks: `frost`, the blurred scene seen through the cards' lenses,
// calmer behind their fields; or `tint`, the phone menu's tint from the sky
// around it. Both find the card each pixel is in the same way; each look
// adds only the functions it uses. `fieldLens` is how much of a lens the
// glass is behind a field (glass.ts FIELD_LENS).
export function compositeShader(mode: 'frost' | 'tint', fieldLens: number) {
  return `
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

${mode === 'frost' ? FROST : TINT}

      void main() {
        vec4 scene = texture2D(tScene, vUv);
        vec2 p = vUv * uSize;
        float at = (1.0 - vUv.y) * ${(FADE_SAMPLES - 1).toFixed(1)};
        int k = int(floor(at));
        float fade = mix(uFade[k], uFade[min(k + 1, ${FADE_SAMPLES - 1})], fract(at));
        float frost = 0.0;
        vec4 box = vec4(0.0, 0.0, 1.0, 1.0);
        float lightness = 0.0;
        vec2 bounds = vec2(0.0, 1.0);
        for (int i = 0; i < ${CARDS}; i++) {
          if (i >= uCount) break;
          ${mode === 'tint' ? 'if (uDeep[i] < 0.5) continue;' : ''}
          float shown = mix(1.0, fade, uFaded[i]) * uOpacity[i];
          float here = inside(p, uCards[i], uRadius[i], uReach[i]) * shown;
          if (here > frost) {
            frost = here;
            box = uCards[i];
            lightness = uLight[i];
            bounds = uBounds[i];
          }
        }
${mode === 'frost' ? frostEnd(fieldLens) : TINT_END}
      }`;
}
