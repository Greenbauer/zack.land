import { useFrame } from '@react-three/fiber';
import { RefObject, useMemo, useRef } from 'react';
import {
  BoxGeometry,
  BufferGeometry,
  DoubleSide,
  ExtrudeGeometry,
  Float32BufferAttribute,
  Group,
  Material,
  Mesh,
  MeshBasicMaterial,
  Shape,
  SphereGeometry,
  Vector3,
} from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

import { headMood } from './headMood';
import { GLOSS } from './headSkin';
import { turnHead } from './headTurn';
import { fadeNeck } from './neckFade';
import { isStill } from './stillScene';
import { StoryProp } from './storyCue';
import { propTarget } from './storyProp';

// What a chapter of the home page's story brings into the scene around the
// head (components/Home/chapters.ts, through headMood.cue): sunglasses that
// drop onto its face, its own wireframe over its skin, small agent heads
// that pop up around it, and a paper plane that flies past. Each eases in
// as its chapter arrives (propTarget, storyProp.ts) and out as it goes;
// with reduced motion none shows. The sunglasses and the wireframe turn
// with the head (turnHead), as its eyes do.

const skinShader: Material['onBeforeCompile'] = (shader) => {
  turnHead(shader);
  fadeNeck(shader);
};

// A geometry carried whole by the skull: every vertex fully the head's, for
// turnHead.
function onSkull(geometry: BufferGeometry): BufferGeometry {
  const count = geometry.getAttribute('position').count;
  geometry.setAttribute(
    'headWeight',
    new Float32BufferAttribute(new Float32Array(count).fill(1), 1),
  );
  geometry.setAttribute(
    'turnWeight',
    new Float32BufferAttribute(new Float32Array(count).fill(1), 1),
  );
  return geometry;
}

const centre = (geometry: BufferGeometry) => {
  geometry.computeBoundingBox();
  return geometry.boundingBox!.getCenter(new Vector3());
};

// A rounded rectangle, w by h, corner radius r, centred on the origin.
function rounded(w: number, h: number, r: number): Shape {
  const s = new Shape();
  const x = -w / 2;
  const y = -h / 2;
  s.moveTo(x + r, y);
  s.lineTo(x + w - r, y);
  s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r);
  s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h);
  s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r);
  s.quadraticCurveTo(x, y, x + r, y);
  return s;
}

// Sunglasses sized to the eyes (Banner Eyewear's shape: square lenses on a
// flat brow bar, arms back to the ears): lenses and frame as two meshes.
function sunglasses(left: Vector3, right: Vector3) {
  const spread = Math.abs(right.x - left.x);
  const mid = (left.x + right.x) / 2;
  const w = spread * 0.84;
  const h = spread * 0.56;
  // Just in front of the eyeballs (their centres are a third of the spread
  // behind their fronts), a little above their middles.
  const z = Math.max(left.z, right.z) + spread * 0.36;
  const y = (left.y + right.y) / 2 + spread * 0.02;
  const lens = (at: Vector3) => {
    const g = new ExtrudeGeometry(rounded(w, h, h * 0.3), {
      depth: spread * 0.03,
      bevelEnabled: false,
      curveSegments: 6,
    });
    g.translate(at.x, y, z);
    return g;
  };
  const rim = (at: Vector3) => {
    const g = new ExtrudeGeometry(rounded(w * 1.1, h * 1.14, h * 0.36), {
      depth: spread * 0.05,
      bevelEnabled: false,
      curveSegments: 6,
    });
    g.translate(at.x, y, z - spread * 0.025);
    return g;
  };
  // The flat brow bar across both lenses, and an arm from each outer
  // corner back past the ear, angled a little out round the head.
  const outer = spread / 2 + (w * 1.1) / 2;
  const bar = new BoxGeometry(outer * 2, h * 0.24, spread * 0.07);
  bar.translate(mid, y + h * 0.48, z + spread * 0.01);
  const length = spread * 2.1;
  const arm = (side: number) => {
    const g = new BoxGeometry(spread * 0.07, h * 0.16, length);
    g.translate(0, 0, -length / 2);
    g.rotateY(side * 0.12);
    g.translate(mid + side * outer, y + h * 0.4, z);
    return g;
  };
  const frame = mergeGeometries(
    [rim(left), rim(right), bar, arm(-1), arm(1)].map((g) => g.toNonIndexed()),
  )!;
  const lenses = mergeGeometries([lens(left), lens(right)])!;
  return { lenses: onSkull(lenses), frame: onSkull(frame), drop: spread * 5 };
}

// A small head: a navy egg with two light eyes, for the agents.
function agentHead() {
  const skull = new SphereGeometry(1, 20, 16);
  skull.scale(0.85, 1, 0.9);
  const eye = (x: number) => {
    const g = new SphereGeometry(0.16, 10, 8);
    g.translate(x, 0.12, 0.8);
    return g;
  };
  return { skull, eyes: mergeGeometries([eye(-0.32), eye(0.32)])! };
}

// A folded paper plane, nose along -x: two wings meeting at a keel.
function paperPlane() {
  const g = new BufferGeometry();
  // prettier-ignore
  const v = [
    -2, 0, 0, 2, 0, -1.6, 2, 0, -0.15, // left wing
    -2, 0, 0, 2, 0, 0.15, 2, 0, 1.6, // right wing
    -2, 0, 0, 2, -0.9, 0, 2, 0, -0.15, // keel, left
    -2, 0, 0, 2, 0, 0.15, 2, -0.9, 0, // keel, right
  ];
  g.setAttribute('position', new Float32BufferAttribute(v, 3));
  g.computeVertexNormals();
  return g;
}

// How quickly a prop eases in and out (per second).
const IN_RATE = 3;
const OUT_RATE = 2.5;
const AGENTS = 6;

export default function StoryProps({
  leftEye,
  rightEye,
  skin,
  skinRef,
}: {
  leftEye: BufferGeometry;
  rightEye: BufferGeometry;
  skin: BufferGeometry;
  skinRef: RefObject<Mesh | null>;
}) {
  const shapes = useMemo(() => {
    const glasses = sunglasses(centre(leftEye), centre(rightEye));
    return {
      glasses,
      agent: agentHead(),
      plane: paperPlane(),
      eyes: centre(leftEye).add(centre(rightEye)).multiplyScalar(0.5),
    };
  }, [leftEye, rightEye]);
  const amount = useRef<Record<StoryProp, number>>({
    sunglasses: 0,
    plane: 0,
    bang: 0,
    agents: 0,
    wireframe: 0,
  });
  const glassesRef = useRef<Group>(null);
  const wireRef = useRef<Mesh>(null);
  const agentsRef = useRef<Group>(null);
  const planeRef = useRef<Group>(null);

  useFrame(({ clock }, delta) => {
    const now = performance.now() / 1000;
    const cue = headMood.cue;
    const still = isStill();
    for (const prop of Object.keys(amount.current) as StoryProp[]) {
      const target = still ? 0 : propTarget(cue, prop, now);
      const was = amount.current[prop];
      const rate = target > was ? IN_RATE : OUT_RATE;
      amount.current[prop] = was + (target - was) * Math.min(1, rate * delta);
    }
    const { sunglasses: glasses, wireframe, agents, plane } = amount.current;

    // The sunglasses drop from above onto the face, slowing as they land.
    if (glassesRef.current) {
      glassesRef.current.visible = glasses > 0.01;
      glassesRef.current.position.y = (1 - glasses) ** 2 * shapes.glasses.drop;
    }

    // The head's own wireframe over its skin, its expressions and all.
    if (wireRef.current) {
      wireRef.current.visible = wireframe > 0.01;
      (wireRef.current.material as MeshBasicMaterial).opacity =
        wireframe * 0.85;
      wireRef.current.morphTargetInfluences =
        skinRef.current?.morphTargetInfluences ?? [];
    }

    // The agents pop up around the head and bob, each at its own pace.
    if (agentsRef.current) {
      agentsRef.current.visible = agents > 0.01;
      agentsRef.current.children.forEach((child, k) => {
        const angle = (k / AGENTS) * Math.PI * 2 + clock.elapsedTime * 0.25;
        // Round the head and well clear of it (it is about 75 across), at
        // brow and cheek height in turn.
        const ring = 72;
        child.position.set(
          Math.cos(angle) * ring,
          (k % 2 ? 24 : -10) + Math.sin(clock.elapsedTime * 2 + k) * 3,
          Math.sin(angle) * ring * 0.45 + 12,
        );
        child.scale.setScalar(
          9 * Math.max(0, Math.min(1, agents * 1.3 - k * 0.05)),
        );
        child.lookAt(0, 0, 200);
      });
    }

    // The plane flies past in front of the head, right to left, every few
    // seconds while its chapter shows.
    if (planeRef.current) {
      planeRef.current.visible = plane > 0.01;
      const t = cue?.prop === 'plane' ? ((now - cue.since) % 5) / 5 : 0;
      planeRef.current.position.set(
        150 - t * 300,
        44 + Math.sin(t * Math.PI * 2) * 8,
        60,
      );
      planeRef.current.rotation.set(0.35, 0.2, Math.sin(t * Math.PI * 4) * 0.3);
      planeRef.current.scale.setScalar(9 * plane);
    }
  });

  return (
    <>
      <group ref={glassesRef} visible={false}>
        <mesh geometry={shapes.glasses.lenses}>
          <meshPhysicalMaterial
            color="#05031c"
            {...GLOSS}
            onBeforeCompile={turnHead}
          />
        </mesh>
        <mesh geometry={shapes.glasses.frame}>
          <meshPhysicalMaterial
            color="#e2607a"
            roughness={0.35}
            onBeforeCompile={turnHead}
          />
        </mesh>
      </group>
      <mesh ref={wireRef} geometry={skin} visible={false}>
        <meshBasicMaterial
          color="#d3aba0"
          wireframe
          transparent
          depthWrite={false}
          onBeforeCompile={skinShader}
        />
      </mesh>
      <group ref={agentsRef} visible={false}>
        {Array.from({ length: AGENTS }, (_, k) => (
          <group key={k}>
            <mesh geometry={shapes.agent.skull}>
              <meshPhysicalMaterial color="#0b1953" {...GLOSS} />
            </mesh>
            <mesh geometry={shapes.agent.eyes}>
              <meshBasicMaterial color="#ede4e3" />
            </mesh>
          </group>
        ))}
      </group>
      <group ref={planeRef} visible={false}>
        <mesh geometry={shapes.plane}>
          <meshPhysicalMaterial
            color="#ede4e3"
            roughness={0.6}
            side={DoubleSide}
            flatShading
          />
        </mesh>
      </group>
    </>
  );
}
