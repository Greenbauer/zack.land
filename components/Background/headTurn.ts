import { Vector3, WebGLProgramParametersWithUniforms } from 'three';

// Turns the head on its neck in the vertex shader. Each vertex carries two
// weights from head.bin (1 on the head, falling to 0 down the neck, 0 on the
// shoulders: scripts/head/rig.mjs). Turning the head to the side twists the
// neck: each vertex turns by its turn weight's share of the turn about the
// top of the spine, the share the spine's joints below it give it. Tipping the
// head (nodding) bends the neck instead, as a real one does, all along its
// length: the weight says how far up the neck a vertex sits, the neck curves
// evenly from its base to the skull, and the head rides on the end of the
// curve. (Tipped about the top of the spine alone, by shares, the neck kinked
// under the skull like a broken one.) The turn comes after the expressions'
// morphs, so they turn with the head. Normals turn with their vertices.

// The head's turn in radians: x tips it (nodding), y turns it (shaking), z
// tilts it to one side (rolling, ambient.ts), set by MyHead each frame.
export const headTurn = { value: new Vector3() };

// Where the skull sits on the spine, in head.bin units: behind the jaw, level
// with the earlobes.
const PIVOT = '0.0, -28.0, -22.0';
// The base of the neck on its axis, where it meets the shoulders (the neck's
// axis as scripts/head/rig.mjs measures it). The neck bends between here and
// PIVOT.
const NECK_BASE = '0.0, -120.0, -45.6';
// The neck bends between its base and the skull (PIVOT, NECK_BASE): forward
// and back for the tip (about x) and to the side for the tilt (rolling the
// head toward a shoulder, about the neck's forward direction), each evenly
// along it as a spine does. (Rolled about the top of the neck alone, with the
// neck held upright, the head looked hinged onto it.) Looking down, a share
// of the tip (TUCK) is instead taken at the joint between the skull and the
// spine, as a real chin tuck is: bent evenly all the way, the head slid
// forward like a slouch. The skull's share fades in over SKULL (heights in
// head.bin units), over the top half of the neck up to the jaw, so the throat
// folds gradually under the chin. (Faded in from the base of the neck, the
// skin low on the back of the neck turned about the skull's joint too, which
// swung it backward into a hump above the shoulders. At 0.75 of the tip,
// faded in from -85, the soft skin under the chin swung back and up into
// the throat with the skull and folded into a sharp notch, 96 degrees on
// the chin's middle; at 0.6 from -95 it rounds into the throat, 80, and the
// face slides forward 5 mm. The neckDown shape's chin tuck,
// scripts/head/bodyShapes.mjs, rolls the skin there forward too.)
const TUCK = 0.6;
const SKULL = '-95.0, -52.0';
// The back of the neck that the skull's share leaves out (skullTip): fading
// in from 5 back to -50 (z), and from -50 up to the skull's base at -28 (y),
// in head.bin units. (Faded in from -10 to -30, the change ran down the side
// of the neck just behind the jaw and showed there as a sharp fold looking
// down.)
const NAPE_BACK = '5.0, -50.0';
const NAPE_HEIGHT = '-50.0, -28.0';
// The body's share of each turn and nod, taken as one piece about the middle
// of the chest (BODY_PIVOT, by the spine at the height of the shoulder
// blades); the neck and head take the rest. A real neck does not turn or
// tip on a still body: the upper back turns and rounds a little with it.
// With the shoulders held still the neck looked like it moved on its own.
// (scripts/head/napeLine.mjs and neckCords.mjs SCM take the neck's share as
// their full pose: keep them in step.)
export const BODY_SHARE = { turn: 0.1, nod: 0.15 };
const BODY_PIVOT = '0.0, -230.0, -45.0';

const TURN_GLSL = `
attribute float headWeight;
attribute float turnWeight;
uniform vec3 uHeadTurn;
// The neck and head's share of the turn (BODY_SHARE).
vec3 neckTurn() {
  return vec3(uHeadTurn.x * ${1 - BODY_SHARE.nod}, uHeadTurn.y * ${1 - BODY_SHARE.turn}, uHeadTurn.z);
}
// The body's share, about BODY_PIVOT: tipped about x, then turned about y.
mat3 bodyRotation() {
  float t = uHeadTurn.y * ${BODY_SHARE.turn};
  float n = uHeadTurn.x * ${BODY_SHARE.nod};
  return mat3(cos(t), 0.0, -sin(t), 0.0, 1.0, 0.0, sin(t), 0.0, cos(t)) *
    mat3(1.0, 0.0, 0.0, 0.0, cos(n), sin(n), 0.0, -sin(n), cos(n));
}
// A turn by a about the unit axis k.
mat3 around(vec3 k, float a) {
  float c = cos(a);
  float s = sin(a);
  float t = 1.0 - c;
  return mat3(
    t * k.x * k.x + c, t * k.x * k.y + s * k.z, t * k.x * k.z - s * k.y,
    t * k.x * k.y - s * k.z, t * k.y * k.y + c, t * k.y * k.z + s * k.x,
    t * k.x * k.z + s * k.y, t * k.y * k.z - s * k.x, t * k.z * k.z + c
  );
}
vec3 neckBase() { return vec3(${NECK_BASE}); }
vec3 neckAxis() { return normalize(vec3(${PIVOT}) - neckBase()); }
// The axes the neck bends about: x to tip the head, its own forward
// direction to tilt it.
vec3 tipAxis() { return vec3(1.0, 0.0, 0.0); }
vec3 tiltAxis() { vec3 a = neckAxis(); return vec3(0.0, -a.z, a.y); }
// Turning to the side, each vertex turns by its turn weight's share: about
// half the turn at the joint just under the skull, the rest a little at each
// joint down the neck (rig.mjs turnWeights), so the throat and its Adam's
// apple twist far less than the head.
mat3 twistRotation() {
  float turn = neckTurn().y * turnWeight;
  return mat3(cos(turn), 0.0, -sin(turn), 0.0, 1.0, 0.0, sin(turn), 0.0, cos(turn));
}
// The tip's share taken at the skull, and what is left for the neck. The
// back of the neck below the skull (NAPE) takes none of it: turned forward
// about the skull's joint, skin behind and below the joint swings backward,
// and it bulged out as a hump at the back of the neck.
float skullTip() {
  float nape = smoothstep(${NAPE_BACK}, position.z) * (1.0 - smoothstep(${NAPE_HEIGHT}, position.y));
  return max(neckTurn().x, 0.0) * ${TUCK} * headWeight * smoothstep(${SKULL}, position.y) * (1.0 - nape);
}
float neckTip() {
  return neckTurn().x - max(neckTurn().x, 0.0) * ${TUCK};
}
mat3 headRotation() {
  return around(tipAxis(), neckTip() * headWeight) *
    around(tipAxis(), skullTip()) * twistRotation() *
    around(tiltAxis(), neckTurn().z * headWeight);
}
// The neck bent by \`angle\` about k, evenly along it: a vertex headWeight of
// the way up it turns by that share of the angle about where its stretch of
// the neck has been carried by the bend below it.
vec3 bendNeck(vec3 p, vec3 k, float angle) {
  vec3 base = neckBase();
  float len = length(vec3(${PIVOT}) - base);
  vec3 axis = neckAxis();
  vec3 side = cross(k, axis);
  float s = headWeight * len;
  float a = angle * headWeight;
  // Where the bend carries the neck's axis at s: the arc of the bent axis
  // (written so it holds as the angle goes to nothing).
  float along = abs(angle) < 1e-4 ? s : sin(a) * len / angle;
  float aside = abs(angle) < 1e-4 ? 0.5 * s * a : (1.0 - cos(a)) * len / angle;
  return base + axis * along + side * aside + around(k, a) * (p - (base + axis * s));
}
`;

export const turnHead = (shader: WebGLProgramParametersWithUniforms): void => {
  shader.uniforms.uHeadTurn = headTurn;
  shader.vertexShader = shader.vertexShader
    .replace('#include <common>', `#include <common>\n${TURN_GLSL}`)
    .replace(
      '#include <morphnormal_vertex>',
      '#include <morphnormal_vertex>\nobjectNormal = bodyRotation() * headRotation() * objectNormal;',
    )
    .replace(
      '#include <morphtarget_vertex>',
      `#include <morphtarget_vertex>
      transformed = bendNeck(transformed, tiltAxis(), neckTurn().z);
      transformed = twistRotation() * (transformed - vec3(${PIVOT})) + vec3(${PIVOT});
      transformed = around(tipAxis(), skullTip()) * (transformed - vec3(${PIVOT})) + vec3(${PIVOT});
      transformed = bendNeck(transformed, tipAxis(), neckTip());
      transformed = bodyRotation() * (transformed - vec3(${BODY_PIVOT})) + vec3(${BODY_PIVOT});`,
    );
};
