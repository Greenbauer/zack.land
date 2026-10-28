import {
  Camera,
  Euler,
  FloatType,
  Light,
  Mesh,
  MeshPhysicalMaterial,
  Object3D,
  PlaneGeometry,
  Scene,
  Vector3,
  Vector4,
  WebGLProgramParametersWithUniforms,
  WebGLRenderer,
  WebGLRenderTarget,
} from 'three';

import type { PixelReader } from './pixelReader';
import { Aim, AIM_REACH, AIM_STEPS, AIMS, SWEEPS } from './titleAim';

// What the name's letters would show, facing each possible aim
// (titleAim.ts), measured by three's own shading rather than guessed: the
// skin's material, with the scene's lights and a turn of the sky, drawn into
// a small offscreen grid. Each column is a point of the name, each row an aim
// (then the sheet's current aim, NOW); each cell is the light the letters
// there would send to the camera (before tone mapping and grading). A last
// row (BACKDROP) is the sky behind each point, as the scene's background
// draws it: so the probe can say what the name and what is behind it will
// look like as the sky turns.

// The most points of the name measured at once.
export const POINTS = 32;
const BACKDROP = AIMS + 1;
const ROWS = AIMS + 2;

// How a sheet facing `aim` (tilt x, y; sweep direction z, w) bends a surface
// normal at `across` (-1 at its left end to 1 at its right), when its full
// sweep tips the normal by `sweep` (the tangent of the angle) at each end:
// GLSL, shared by the letters and the probe so both bend alike.
export function bendSheet(sweep: number) {
  return `
    vec3 sheetBend(vec3 n, float across, vec4 aim) {
      vec3 tilt = vec3(aim.xy + across * ${sweep.toFixed(3)} * aim.zw, 0.0);
      return normalize(n + tilt * n.z);
    }`;
}

const glslFloat = (n: number) => n.toFixed(3);

export class AimProbe {
  private readonly scene = new Scene();
  private readonly target = new WebGLRenderTarget(POINTS, ROWS, {
    type: FloatType,
    depthBuffer: false,
  });
  private readonly material: MeshPhysicalMaterial;
  private readonly points = Array.from({ length: POINTS }, () => new Vector3());
  private readonly across = Array<number>(POINTS).fill(0);
  private readonly now = { value: new Vector4() };
  private readonly blur = { value: 0 };
  private readonly intensity = { value: 1 };

  constructor(skin: MeshPhysicalMaterial, sweep: number, lights: Light[]) {
    this.material = skin.clone();
    this.material.onBeforeCompile = (
      shader: WebGLProgramParametersWithUniforms,
    ) => {
      shader.uniforms.uProbePoints = { value: this.points };
      shader.uniforms.uProbeAcross = { value: this.across };
      shader.uniforms.uProbeNow = this.now;
      shader.uniforms.uProbeBlur = this.blur;
      shader.uniforms.uProbeIntensity = this.intensity;
      // One quad over the whole grid.
      shader.vertexShader = shader.vertexShader.replace(
        '#include <project_vertex>',
        'vec4 mvPosition = vec4(0.0, 0.0, -1.0, 1.0);\ngl_Position = vec4(position.xy, 0.0, 1.0);',
      );
      // Each cell's point and normal, in place of the vertex shader's.
      shader.fragmentShader = shader.fragmentShader
        .replace('varying vec3 vViewPosition;', 'vec3 vViewPosition;')
        .replace('#include <normal_pars_fragment>', 'vec3 vNormal;')
        .replace(
          '#include <common>',
          `#include <common>
          uniform vec3 uProbePoints[${POINTS}];
          uniform float uProbeAcross[${POINTS}];
          uniform vec4 uProbeNow;
          uniform float uProbeBlur;
          uniform float uProbeIntensity;
          ${bendSheet(sweep)}
          vec4 probeAim(int row) {
            if (row >= ${AIMS}) return uProbeNow;
            int square = ${AIM_STEPS * AIM_STEPS};
            int s = row / square;
            int r = row - s * square;
            vec2 sweeps[${SWEEPS.length}] = vec2[](${SWEEPS.map(([x, y]) => `vec2(${glslFloat(x!)}, ${glslFloat(y!)})`).join(', ')});
            float step = ${glslFloat((2 * AIM_REACH) / (AIM_STEPS - 1))};
            return vec4(
              -${glslFloat(AIM_REACH)} + float(r / ${AIM_STEPS}) * step,
              -${glslFloat(AIM_REACH)} + float(r - (r / ${AIM_STEPS}) * ${AIM_STEPS}) * step,
              sweeps[s]);
          }`,
        )
        .replace(
          'void main() {',
          `void main() {
          int probeColumn = int(gl_FragCoord.x);
          vec4 probeFacing = probeAim(int(gl_FragCoord.y));
          float probeAcross = uProbeAcross[probeColumn];
          vViewPosition = -(viewMatrix * vec4(uProbePoints[probeColumn], 1.0)).xyz;
          vNormal = normalize((viewMatrix * vec4(0.0, 0.0, 1.0, 0.0)).xyz);`,
        )
        .replace(
          '#include <normal_fragment_maps>',
          `#include <normal_fragment_maps>
          normal = sheetBend(normal, probeAcross, probeFacing);`,
        )
        .replace(
          '#include <clearcoat_normal_fragment_maps>',
          `#include <clearcoat_normal_fragment_maps>
          clearcoatNormal = sheetBend(clearcoatNormal, probeAcross, probeFacing);`,
        )
        .replace(
          '#include <opaque_fragment>',
          `#include <opaque_fragment>
          if (int(gl_FragCoord.y) == ${BACKDROP}) {
            vec3 probeView = normalize(uProbePoints[probeColumn] - cameraPosition);
            gl_FragColor = vec4(
              textureCubeUV(envMap, envMapRotation * probeView, uProbeBlur).rgb
                * uProbeIntensity,
              1.0);
          }`,
        );
    };
    const quad = new Mesh(new PlaneGeometry(2, 2), this.material);
    quad.frustumCulled = false;
    this.scene.add(quad, ...lights.map((light) => light.clone()));
  }

  // The scene's lights, to light the probe as the letters are lit.
  static lightsOf(scene: Object3D) {
    const lights: Light[] = [];
    scene.traverse((object) => {
      if ((object as Light).isLight) lights.push(object as Light);
    });
    return lights;
  }

  // Measures each point (world position on the letters' plane, and how far
  // across the sheet it sits) at every aim and at `now`, with the sky turned
  // to `rotation` and drawn behind as `sky` says, into `reader`'s batch
  // (pixelReader.ts): AimProbe.view reads what arrives.
  measure(
    gl: WebGLRenderer,
    camera: Camera,
    skin: MeshPhysicalMaterial,
    points: { position: Vector3; across: number }[],
    now: Aim,
    rotation: Euler,
    sky: { blurriness: number; intensity: number },
    reader: PixelReader,
  ) {
    const material = this.material;
    if (material.envMap !== skin.envMap) {
      material.envMap = skin.envMap;
      material.needsUpdate = true;
    }
    material.envMapRotation.copy(rotation);
    this.blur.value = sky.blurriness;
    this.intensity.value = sky.intensity;
    points.slice(0, POINTS).forEach(({ position, across }, k) => {
      this.points[k]!.copy(position);
      this.across[k] = across;
    });
    this.now.value.set(now.x, now.y, now.sweepX, now.sweepY);
    const previous = gl.getRenderTarget();
    gl.setRenderTarget(this.target);
    gl.render(this.scene, camera);
    reader.read({ x: 0, y: 0, width: POINTS, height: ROWS }, true);
    gl.setRenderTarget(previous);
  }

  // A measurement as it arrives: `light(row, point)` in luminance (row NOW
  // is the sheet's aim at the time), `colour(row, point)` in red, green and
  // blue, and `behind(point)` the sky behind it, in luminance.
  static view(pixels: Float32Array) {
    const light = (row: number, point: number) => {
      const i = (row * POINTS + point) * 4;
      return (
        0.2126 * pixels[i]! + 0.7152 * pixels[i + 1]! + 0.0722 * pixels[i + 2]!
      );
    };
    const colour = (row: number, point: number) => {
      const i = (row * POINTS + point) * 4;
      return [pixels[i]!, pixels[i + 1]!, pixels[i + 2]!];
    };
    return {
      light,
      colour,
      behind: (point: number) => light(BACKDROP, point),
    };
  }

  dispose() {
    this.target.dispose();
    this.material.dispose();
  }
}
