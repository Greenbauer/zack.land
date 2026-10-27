import { Vector2, WebGLProgramParametersWithUniforms } from 'three';

// Turns the head on its neck in the vertex shader. Each vertex carries a head
// weight from head.bin (1 on the head, falling to 0 down the neck, 0 on the
// shoulders), and is turned by that share of the head's turn about the top of
// the spine, so the neck twists and bends between a turning head and still
// shoulders. The turn comes after the expressions' morphs, so they turn with
// the head. Normals turn with their vertices.

// The head's turn in radians: x tips it (nodding), y turns it (shaking),
// set by MyHead each frame.
export const headTurn = { value: new Vector2() };

// Where the skull sits on the spine, in head.bin units: behind the jaw, level
// with the earlobes.
const PIVOT = '0.0, -28.0, -22.0';

const TURN_GLSL = `
attribute float headWeight;
uniform vec2 uHeadTurn;
mat3 headRotation() {
  float tip = uHeadTurn.x * headWeight;
  float turn = uHeadTurn.y * headWeight;
  mat3 aroundX = mat3(1.0, 0.0, 0.0, 0.0, cos(tip), sin(tip), 0.0, -sin(tip), cos(tip));
  mat3 aroundY = mat3(cos(turn), 0.0, -sin(turn), 0.0, 1.0, 0.0, sin(turn), 0.0, cos(turn));
  return aroundX * aroundY;
}
`;

export const turnHead = (shader: WebGLProgramParametersWithUniforms): void => {
  shader.uniforms.uHeadTurn = headTurn;
  shader.vertexShader = shader.vertexShader
    .replace('#include <common>', `#include <common>\n${TURN_GLSL}`)
    .replace(
      '#include <morphnormal_vertex>',
      '#include <morphnormal_vertex>\nobjectNormal = headRotation() * objectNormal;',
    )
    .replace(
      '#include <morphtarget_vertex>',
      `#include <morphtarget_vertex>
      transformed = headRotation() * (transformed - vec3(${PIVOT})) + vec3(${PIVOT});`,
    );
};
