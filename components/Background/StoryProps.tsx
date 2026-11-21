import { useFrame } from '@react-three/fiber';
import { RefObject, useEffect, useMemo, useRef, useState } from 'react';
import {
  BufferGeometry,
  DoubleSide,
  Float32BufferAttribute,
  Group,
  Material,
  Mesh,
  MeshBasicMaterial,
  SphereGeometry,
  Vector3,
} from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

import { Glasses, loadGlasses } from './glassesGeometry';
import { headMood } from './headMood';
import { GLOSS } from './headSkin';
import { turnHead } from './headTurn';
import { fadeNeck } from './neckFade';
import { isStill } from './stillScene';
import { StoryCue, StoryProp } from './storyCue';
import { PROP_DELAY, propTarget } from './storyProp';

// What a chapter of the home page's story brings into the scene around the
// head (components/Home/chapters.ts, through headMood.cue): sunglasses that
// drop onto its face, its own wireframe over its skin, small agent heads
// that pop up around it, and a paper plane that flies past. Each eases in
// as its chapter arrives (propTarget, storyProp.ts) and out as it goes;
// with reduced motion none shows. The sunglasses and the wireframe turn
// with the head (turnHead), as its eyes do. What it shows is named on the
// page as data-story-prop on <html> (space-separated, empty for none): a 3D
// prop once it is well in, and the bang once its moment has come in this
// chapter (the flash itself is the page's, components/Home/StoryFlash.tsx,
// timed by the same propTarget).

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

// The Banner Eyewear sunglasses (glassesGeometry.ts) fitted to the head:
// scaled so their lenses' centres sit about as far apart as its eyes, the
// bridge resting on its nose, every part carried by the skull.
// Returns the parts, and how far above their place they drop from.
function fitGlasses(glasses: Glasses, left: Vector3, right: Vector3) {
  const spread = Math.abs(right.x - left.x);
  const lenses = glasses.lenses.clone();
  lenses.computeBoundingBox();
  const box = lenses.boundingBox!;
  // A lens's middle, from the right half of both lenses.
  const lensX = (box.max.x + Math.max(0, box.min.x)) / 2 || box.max.x / 2;
  const scale = (spread * 0.94) / (2 * lensX);
  const lift = (box.min.y + box.max.y) / 2;
  const back = box.min.z;
  const at = new Vector3(
    (left.x + right.x) / 2,
    (left.y + right.y) / 2 + spread * 0.04,
    Math.max(left.z, right.z) + spread * 0.6,
  );
  const placed = (geometry: BufferGeometry) => {
    const g = geometry.clone();
    g.translate(0, -lift, -back);
    g.scale(scale, scale, scale);
    g.translate(at.x, at.y, at.z);
    return onSkull(g);
  };
  return {
    frame: placed(glasses.frame),
    lenses: placed(glasses.lenses),
    left: placed(glasses.left),
    right: placed(glasses.right),
    drop: spread * 5,
  };
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
  const shapes = useMemo(
    () => ({ agent: agentHead(), plane: paperPlane() }),
    [],
  );
  // The sunglasses, fetched once the story has started (a chapter's cue),
  // well before Banner Eyewear's chapter comes round.
  const [model, setModel] = useState<Glasses | null>(null);
  useEffect(() => {
    if (model) return;
    const timer = setInterval(() => {
      if (!headMood.cue) return;
      clearInterval(timer);
      loadGlasses().then(setModel, () => {});
    }, 500);
    return () => clearInterval(timer);
  }, [model]);
  const glasses = useMemo(
    () => model && fitGlasses(model, centre(leftEye), centre(rightEye)),
    [model, leftEye, rightEye],
  );
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
  const banged = useRef<StoryCue | null>(null);

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
    const { sunglasses: wearing, wireframe, agents, plane } = amount.current;
    // The bang's moment is told by the clock, not by a frame that caught its
    // flash: at a frame a second (a browser drawing in software) a frame
    // can miss it.
    if (!still && cue?.prop === 'bang' && now >= cue.since + PROP_DELAY.bang)
      banged.current = cue;
    const drawn: StoryProp[] = (
      ['sunglasses', 'plane', 'agents', 'wireframe'] as const
    ).filter(
      (prop) =>
        amount.current[prop] > 0.5 && (prop !== 'sunglasses' || !!glasses),
    );
    if (cue && banged.current === cue) drawn.push('bang');
    const named = drawn.join(' ');
    const root = document.documentElement;
    if (root.dataset.storyProp !== named) root.dataset.storyProp = named;

    // The sunglasses drop from above onto the face, slowing as they land.
    if (glassesRef.current && glasses) {
      glassesRef.current.visible = wearing > 0.01;
      glassesRef.current.position.y = (1 - wearing) ** 2 * glasses.drop;
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
      {/* Banner Eyewear's colours: a gray front, dark lenses, orange and
          pink arms (the pair in its photos). */}
      {glasses && (
        <group ref={glassesRef} visible={false}>
          <mesh geometry={glasses.frame}>
            <meshPhysicalMaterial
              color="#9c9b96"
              roughness={0.4}
              onBeforeCompile={turnHead}
            />
          </mesh>
          <mesh geometry={glasses.lenses}>
            <meshPhysicalMaterial
              color="#05031c"
              {...GLOSS}
              onBeforeCompile={turnHead}
            />
          </mesh>
          <mesh geometry={glasses.left}>
            <meshPhysicalMaterial
              color="#f57a3d"
              roughness={0.5}
              onBeforeCompile={turnHead}
            />
          </mesh>
          <mesh geometry={glasses.right}>
            <meshPhysicalMaterial
              color="#d742a0"
              roughness={0.5}
              onBeforeCompile={turnHead}
            />
          </mesh>
        </group>
      )}
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
