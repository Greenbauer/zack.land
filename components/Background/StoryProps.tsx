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
  Vector3,
} from 'three';

import { armFit, fitScale } from './glassesFit';
import { Glasses, loadGlasses } from './glassesGeometry';
import { headMood } from './headMood';
import { GLOSS } from './headSkin';
import { turnHead } from './headTurn';
import { fadeNeck } from './neckFade';
import { phoneShown } from './PhoneCall';
import { isStill } from './stillScene';
import { StoryProp } from './storyCue';
import { propTarget } from './storyProp';
import TexasTechProps from './TexasTechProps';

// What a chapter of the home page's story brings into the scene around the
// head (components/Home/chapters.ts, through headMood.cue): sunglasses that
// drop onto its face, its own wireframe over its skin, a graduation cap and
// flying tortillas (TexasTechProps.tsx), a paper plane that flies past, and
// a phone that takes the head's place (PhoneCall.tsx, drawn beside the head
// by MyHead.tsx, which this tells how far in it is).
// Each eases in as its chapter arrives (propTarget, storyProp.ts) and out
// as it goes; with reduced motion none shows. The sunglasses, the cap and
// the wireframe turn with the head (turnHead), as its eyes do. What it
// shows is named on the page as data-story-prop on <html> (empty for none),
// each prop once it is well in.

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

// The Banner Eyewear sunglasses (glassesGeometry.ts) fitted to the head as
// the real pair fits Zack: the model whole, every part scaled alike, just
// large enough that the front of both arms (TEMPLE_SHARE of each, by the
// temples) clears the side of the head (glassesFit.ts); from there the
// straight arms run back past the ears as the real ones do, pressing on the
// head. The lenses are centred between the eyes and the bridge rests on
// the nose, every part carried by the skull. Fitted to the eyes' spacing
// instead, the frame came out narrower than the head and its arms had to be
// bent round it.
// Returns the parts, and how far above their place they drop from.
// How much of each arm, from its hinge, clears the head: its front, at the
// temple. Behind it the arms angle in to grip, as a real pair's do.
const TEMPLE_SHARE = 0.25;

function fitGlasses(
  glasses: Glasses,
  left: Vector3,
  right: Vector3,
  skin: BufferGeometry,
) {
  const spread = Math.abs(right.x - left.x);
  const lenses = glasses.lenses.clone();
  lenses.computeBoundingBox();
  const box = lenses.boundingBox!;
  // A lens's middle, from the right half of both lenses.
  const lensX = (box.max.x + Math.max(0, box.min.x)) / 2 || box.max.x / 2;
  // The scale that would put the lenses' middles on the eyes: the least the
  // pair is ever scaled to.
  const byEyes = (spread * 0.94) / (2 * lensX);
  const lift = (box.min.y + box.max.y) / 2;
  const back = box.min.z;
  const at = new Vector3(
    (left.x + right.x) / 2,
    (left.y + right.y) / 2 + spread * 0.04,
    Math.max(left.z, right.z) + spread * 0.6,
  );
  const placed = (geometry: BufferGeometry, scale: number) => {
    const g = geometry.clone();
    g.translate(0, -lift, -back);
    g.scale(scale, scale, scale);
    g.translate(at.x, at.y, at.z);
    g.computeBoundingBox();
    return g;
  };
  // Whether both arms' fronts, at `scale`, clear the head beside their
  // words, with a small gap (armFit asks no push anywhere along them).
  const head = skin.getAttribute('position').array;
  const clears = (scale: number) =>
    (
      [
        [1, glasses.left, glasses.leftText],
        [-1, glasses.right, glasses.rightText],
      ] as const
    ).every(([side, track, word]) => {
      const trackBox = placed(track, scale).boundingBox!;
      const wordBox = placed(word, scale).boundingBox!;
      const hinge = {
        x: side > 0 ? trackBox.min.x : trackBox.max.x,
        z: trackBox.max.z,
      };
      const span = {
        low: wordBox.min.y,
        high: wordBox.max.y,
        back: hinge.z - (hinge.z - wordBox.min.z) * TEMPLE_SHARE,
      };
      return Math.max(...armFit(head, hinge, side, span, spread * 0.03)) === 0;
    });
  const scale = fitScale(clears, byEyes, byEyes * 2);
  const part = (geometry: BufferGeometry) => onSkull(placed(geometry, scale));
  return {
    frame: part(glasses.frame),
    lenses: part(glasses.lenses),
    left: part(glasses.left),
    right: part(glasses.right),
    leftText: part(glasses.leftText),
    rightText: part(glasses.rightText),
    drop: spread * 5,
  };
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

// Names what the scene shows on the page, as data-story-prop on <html>: each
// prop once it is well in (the sunglasses once their model has loaded).
function nameDrawn(amounts: Record<StoryProp, number>, hasGlasses: boolean) {
  const named = (Object.keys(amounts) as StoryProp[])
    .filter(
      (prop) => amounts[prop] > 0.5 && (prop !== 'sunglasses' || hasGlasses),
    )
    .join(' ');
  const root = document.documentElement;
  if (root.dataset.storyProp !== named) root.dataset.storyProp = named;
}

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
  const plane = useMemo(() => paperPlane(), []);
  // The head's own measure: the distance between its eyes.
  const spread = useMemo(
    () => Math.abs(centre(rightEye).x - centre(leftEye).x),
    [leftEye, rightEye],
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
    () => model && fitGlasses(model, centre(leftEye), centre(rightEye), skin),
    [model, leftEye, rightEye, skin],
  );
  const amount = useRef<Record<StoryProp, number>>({
    sunglasses: 0,
    plane: 0,
    wireframe: 0,
    tortillas: 0,
    phone: 0,
  });
  const glassesRef = useRef<Group>(null);
  const wireRef = useRef<Mesh>(null);
  const planeRef = useRef<Group>(null);

  useFrame((_state, delta) => {
    const now = performance.now() / 1000;
    const cue = headMood.cue;
    const still = isStill();
    for (const prop of Object.keys(amount.current) as StoryProp[]) {
      const target = still ? 0 : propTarget(cue, prop, now);
      const was = amount.current[prop];
      const rate = target > was ? IN_RATE : OUT_RATE;
      amount.current[prop] = was + (target - was) * Math.min(1, rate * delta);
    }
    const { sunglasses: wearing, wireframe, plane: flying } = amount.current;
    nameDrawn(amount.current, !!glasses);
    phoneShown.value = amount.current.phone;

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

    // The plane flies past in front of the head, right to left, every few
    // seconds while its chapter shows.
    if (planeRef.current) {
      planeRef.current.visible = flying > 0.01;
      const t = cue?.prop === 'plane' ? ((now - cue.since) % 5) / 5 : 0;
      planeRef.current.position.set(
        150 - t * 300,
        44 + Math.sin(t * Math.PI * 2) * 8,
        60,
      );
      planeRef.current.rotation.set(0.35, 0.2, Math.sin(t * Math.PI * 4) * 0.3);
      planeRef.current.scale.setScalar(9 * flying);
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
          {/* Each arm and the word it carries (EYEWEAR on the left, BANNER
              on the right) are one colour, as the site prints them. */}
          {(['left', 'leftText'] as const).map((part) => (
            <mesh key={part} geometry={glasses[part]}>
              <meshPhysicalMaterial
                color="#f57a3d"
                roughness={0.5}
                onBeforeCompile={turnHead}
              />
            </mesh>
          ))}
          {(['right', 'rightText'] as const).map((part) => (
            <mesh key={part} geometry={glasses[part]}>
              <meshPhysicalMaterial
                color="#d742a0"
                roughness={0.5}
                onBeforeCompile={turnHead}
              />
            </mesh>
          ))}
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
      <TexasTechProps spread={spread} amounts={amount} />
      <group ref={planeRef} visible={false}>
        <mesh geometry={plane}>
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
