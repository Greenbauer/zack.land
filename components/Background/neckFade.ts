import { WebGLProgramParametersWithUniforms } from 'three';

// A haze rises from below: thin just under the chin, thickening as it goes
// down until the bust is lost in it. The haze both veils what it covers (it
// lightens toward HAZE_COLOR, a lavender like the dawn sky's) and, deeper in,
// lets the sky through, so the bust dissolves rather than being cut. Its top
// is uneven and drifts slowly upward, like mist, but level overall: it lies
// at the same height over the neck and the shoulders.
//
// Heights are in the head model's own units (head.bin): the chin ends near
// -64, the notch at the base of the throat sits near -124, and the bust is
// cut at -150 through the upper arms and -250 under the chest. The haze is
// solid from FADE_BOTTOM down, and FADE_BOTTOM less the noise's reach stays
// above every cut, so no cut ever shows.
export const FADE_TOP = -66;
export const FADE_BOTTOM = -132;
export const FADE_NOISE = 16;
const HAZE_COLOR = '0.62, 0.58, 0.82';
export const HAZE_VEIL = 0.55;
// Fog below this much only veils; past it the surface starts to let the sky
// through.
export const HAZE_CLEAR = 0.35;

// Seconds since the scene started, advanced by MyHead each frame.
export const fadeTime = { value: 0 };

const FADE_GLSL = `
varying vec3 vLocal;
uniform float uFadeTime;
float fadeHash(vec3 p) {
  p = fract(p * 0.3183099 + 0.1);
  p *= 17.0;
  return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
}
float fadeNoise(vec3 x) {
  vec3 i = floor(x);
  vec3 f = fract(x);
  f = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(mix(fadeHash(i), fadeHash(i + vec3(1, 0, 0)), f.x),
        mix(fadeHash(i + vec3(0, 1, 0)), fadeHash(i + vec3(1, 1, 0)), f.x), f.y),
    mix(mix(fadeHash(i + vec3(0, 0, 1)), fadeHash(i + vec3(1, 0, 1)), f.x),
        mix(fadeHash(i + vec3(0, 1, 1)), fadeHash(i + vec3(1, 1, 1)), f.x), f.y),
    f.z);
}
float fadeHaze(vec3 p) {
  float value = 0.0;
  float amplitude = 0.5;
  for (int octave = 0; octave < 4; octave++) {
    value += amplitude * fadeNoise(p);
    p *= 2.0;
    amplitude *= 0.5;
  }
  return value;
}
`;

export const fadeNeck = (shader: WebGLProgramParametersWithUniforms): void => {
  shader.uniforms.uFadeTime = fadeTime;
  shader.vertexShader = shader.vertexShader
    .replace('#include <common>', '#include <common>\nvarying vec3 vLocal;')
    .replace(
      '#include <begin_vertex>',
      '#include <begin_vertex>\nvLocal = position;',
    );
  shader.fragmentShader = shader.fragmentShader
    .replace('#include <common>', `#include <common>\n${FADE_GLSL}`)
    .replace(
      '#include <opaque_fragment>',
      `#include <opaque_fragment>
      float haze = fadeHaze(vLocal * 0.015 - vec3(0.0, uFadeTime * 0.06, 0.0));
      float depth = vLocal.y + (haze - 0.5) * ${FADE_NOISE}.0;
      float fog = 1.0 - smoothstep(${FADE_BOTTOM}.0, ${FADE_TOP}.0, depth);
      gl_FragColor.rgb = mix(gl_FragColor.rgb, vec3(${HAZE_COLOR}), fog * ${HAZE_VEIL});
      gl_FragColor.a *= 1.0 - smoothstep(${HAZE_CLEAR}, 1.0, fog);`,
    );
};
