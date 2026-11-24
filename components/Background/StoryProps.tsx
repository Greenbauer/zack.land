import { useFrame } from '@react-three/fiber';
import { RefObject, useEffect, useMemo, useRef, useState } from 'react';
import {
  BufferAttribute,
  BufferGeometry,
  DoubleSide,
  Float32BufferAttribute,
  Group,
  Material,
  Mesh,
  MeshBasicMaterial,
  SRGBColorSpace,
  TextureLoader,
  Vector3,
} from 'three';

import head from '@/theme/head.json';

import {
  armLength,
  earTop,
  flexAmount,
  flexArm,
  noseBridge,
  STRAIGHT_SHARE,
  templeWidth,
} from './glassesFit';
import { Glasses, loadGlasses } from './glassesGeometry';
import { headMood } from './headMood';
import { turnHead } from './headTurn';
import { fadeNeck } from './neckFade';
import { phoneShown } from './PhoneCall';
import { centre, onSkull } from './skull';
import SleepMaskProp from './SleepMaskProp';
import { isStill } from './stillScene';
import { StoryProp } from './storyCue';
import { propTarget } from './storyProp';
import TexasTechProps from './TexasTechProps';
import { wireStrength } from './wireSeam';

// What a chapter of the home page's story brings into the scene around the
// head (components/Home/chapters.ts, through headMood.cue): sunglasses that
// drop onto its face, its own wireframe in place of its skin, a graduation cap and
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

// The Banner Eyewear sunglasses (glassesGeometry.ts) on the head as the real
// pair sits on a face (the model photo in the Banner Eyewear post): scaled so
// its front is as wide as the head at the temples, its lenses level with the
// eyes, its bridge resting on the nose, tipped about the bridge until the
// arms rest on the tops of the ears, and each arm flexed in one smooth curve
// just enough to clear the skull (glassesFit.ts), every part carried by the
// skull. Scaled to clear the head with its arms straight it came out far too
// big; scaled to the eyes, too narrow.
// Returns the parts, and how far above their place they drop from.
function fitGlasses(
  glasses: Glasses,
  left: Vector3,
  right: Vector3,
  skin: BufferGeometry,
) {
  const spread = Math.abs(right.x - left.x);
  const eyes = left.clone().add(right).multiplyScalar(0.5);
  const head = skin.getAttribute('position').array;
  const front = glasses.frame.clone();
  front.computeBoundingBox();
  const frame = front.boundingBox!;
  const lenses = glasses.lenses.clone();
  lenses.computeBoundingBox();
  const lensBox = lenses.boundingBox!;
  // Across the temples: just above the eyes, in front of the ears.
  const temples = templeWidth(head, {
    low: eyes.y,
    high: eyes.y + spread * 0.6,
    back: eyes.z - spread,
    front: eyes.z - spread * 0.5,
  });
  // A touch narrower than the temples: as wide as them, it stood out past
  // them as the head turned.
  const scale = (FRAME_WIDTH * temples) / (frame.max.x - frame.min.x);
  // The bridge's back (the frame's rearmost point near its middle), in the
  // model's millimetres.
  const positions = glasses.frame.getAttribute('position');
  let bridgeBack = Infinity;
  for (let k = 0; k < positions.count; k++)
    if (Math.abs(positions.getX(k)) < 8)
      bridgeBack = Math.min(bridgeBack, positions.getZ(k));
  const nose = noseBridge(head, {
    low: eyes.y - spread * 0.1,
    high: eyes.y + spread * 0.3,
    reach: spread * 0.1,
  });
  const lift = (lensBox.min.y + lensBox.max.y) / 2;
  const at = new Vector3(eyes.x, eyes.y + spread * 0.04, nose + spread * 0.03);
  // Tipped about the bridge (the lenses barely move) by `tilt`, so the arms
  // rest on the tops of the ears: down onto them, or up over them.
  const pivot = new Vector3(at.x, at.y, at.z);
  const placed = (geometry: BufferGeometry, tilt = 0) => {
    const g = geometry.clone();
    g.translate(0, -lift, -bridgeBack);
    g.scale(scale, scale, scale);
    g.translate(at.x, at.y, at.z);
    g.translate(-pivot.x, -pivot.y, -pivot.z);
    g.rotateX(-tilt);
    g.translate(pivot.x, pivot.y, pivot.z);
    g.computeBoundingBox();
    return g;
  };
  // How far to tip it: until the underside of the arms' straight part, at
  // the ears, rests just on the tops of the ears (its hooks curl down
  // behind them), so the ears do not push the arms out.
  const ears = earTop(head, {
    beyond: temples / 2 + spread * 0.15,
    back: eyes.z - spread * 2.5,
    front: eyes.z - spread * 0.6,
    high: eyes.y + spread * 0.6,
  });
  const level = placed(glasses.left).getAttribute('position');
  let behind = 0;
  for (let k = 0; k < level.count; k++)
    behind = Math.max(behind, pivot.z - level.getZ(k));
  const reach = behind * STRAIGHT_SHARE;
  let under = Infinity;
  for (let k = 0; k < level.count; k++)
    if (Math.abs(pivot.z - level.getZ(k) - reach) < spread * 0.2)
      under = Math.min(under, level.getY(k) - pivot.y);
  const tilt = Number.isFinite(ears)
    ? Math.min(
        Math.max(
          Math.atan2(under - (ears - pivot.y) - spread * 0.03, reach),
          -MOST_TILT,
        ),
        MOST_TILT,
      )
    : 0;
  // Each arm and its word flexed together, outward from the arm's hinge
  // (its front end's outer edge), just enough to clear the skull.
  const arm = (side: 1 | -1, track: BufferGeometry, word: BufferGeometry) => {
    const [armPlaced, wordPlaced] = [placed(track, tilt), placed(word, tilt)];
    const box = armPlaced.boundingBox!;
    const hinge = { x: side > 0 ? box.max.x : box.min.x, z: box.max.z };
    const points = [
      ...armPlaced.getAttribute('position').array,
      ...wordPlaced.getAttribute('position').array,
    ];
    const amount = flexAmount(head, points, hinge, side, spread * 0.03);
    const length = armLength(points, hinge, side);
    return [armPlaced, wordPlaced].map((g) =>
      onSkull(flexArm(g, hinge, side, amount, length)),
    ) as [BufferGeometry, BufferGeometry];
  };
  const [leftArm, leftText] = arm(1, glasses.left, glasses.leftText);
  const [rightArm, rightText] = arm(-1, glasses.right, glasses.rightText);
  return {
    frame: onSkull(placed(glasses.frame, tilt)),
    lenses: onSkull(placed(glasses.lenses, tilt)),
    left: leftArm,
    right: rightArm,
    leftText,
    rightText,
    drop: spread * 5,
  };
}

// The most the sunglasses are tipped either way to bring their arms onto
// the ears (radians): about a real pair's tilt.
const MOST_TILT = (15 * Math.PI) / 180;

// How much of the sky's light the printed frame and arms take: little, so
// they keep their own colours.
const PRINTED_SKY = 0.15;
// The pair's colours as the laptop photo shows them under this scene's
// lavender light, which lifts and cools colours: a mid grey, a true orange
// and a deep pink (the builder's #9c9b96, #f57a3d and #d742a0 came out
// lilac-white, peach and candy pink).
const FRAME_GREY = '#4c4740';
const ARM_ORANGE = '#e8430a';
const ARM_PINK = '#cc1f7a';
// How wide the frame is against the head at the temples.
const FRAME_WIDTH = 0.94;

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

// How far the head is only its wireframe, 0 to 1 (this website's chapter):
// MyHead.tsx fades the skin away by it, so the wireframe shows alone.
export const wireShown = { value: 0 };

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
  // The builder's own lens logo (public/story/lens, from banner-builder's
  // Textures/Lens), loaded with the glasses.
  const lensLogo = useMemo(() => {
    if (!model) return null;
    const texture = new TextureLoader().load('/story/lens/logo.png');
    texture.colorSpace = SRGBColorSpace;
    return texture;
  }, [model]);
  const glasses = useMemo(
    () => model && fitGlasses(model, centre(leftEye), centre(rightEye), skin),
    [model, leftEye, rightEye, skin],
  );
  const amount = useRef<Record<StoryProp, number>>({
    sunglasses: 0,
    sleepmask: 0,
    plane: 0,
    wireframe: 0,
    tortillas: 0,
    phone: 0,
  });
  const glassesRef = useRef<Group>(null);
  const wireRef = useRef<Mesh>(null);
  // The wireframe: the skin's own points, triangles and expressions, each
  // point's lines drawn as strongly as wireSeam.ts says (fainter where the
  // seam round the neck crowds them), as its colours' alpha.
  const wire = useMemo(() => {
    const geometry = new BufferGeometry();
    geometry.attributes = { ...skin.attributes };
    geometry.morphAttributes = skin.morphAttributes;
    geometry.morphTargetsRelative = skin.morphTargetsRelative;
    geometry.setIndex(skin.getIndex());
    const strength = wireStrength(
      skin.getAttribute('position').array,
      skin.getIndex()!.array,
    );
    const colours = new Float32Array(strength.length * 4).fill(1);
    strength.forEach((a, i) => (colours[i * 4 + 3] = a));
    geometry.setAttribute('color', new BufferAttribute(colours, 4));
    return geometry;
  }, [skin]);
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

    // The head's own wireframe, its expressions and all, in place of its
    // skin (wireShown): the skin fading out over it, still hiding the lines
    // behind it, so the wireframe shows clean rather than over the skin's
    // reflections.
    wireShown.value = wireframe;
    if (wireRef.current) {
      wireRef.current.visible = wireframe > 0.01;
      (wireRef.current.material as MeshBasicMaterial).opacity = wireframe;
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
          {/* As the pair in the Banner Eyewear post's laptop photo: grey
              frame, Midnight Blue mirrored lenses with the builder's logo in
              their top corner, BANNER on an orange arm and EYEWEAR on a pink
              one. The frame and arms are matte, as printed nylon is, and
              take little of the sky (PRINTED_SKY), whose lavender washed the
              grey toward white and the pink toward salmon. The lenses are a
              mirror: they show the sky. */}
          <mesh geometry={glasses.frame}>
            <meshStandardMaterial
              color={FRAME_GREY}
              roughness={0.85}
              envMapIntensity={PRINTED_SKY}
              onBeforeCompile={turnHead}
            />
          </mesh>
          <mesh geometry={glasses.lenses}>
            <meshPhysicalMaterial
              color="#3a3290"
              metalness={1}
              roughness={0.38}
              clearcoat={1}
              clearcoatRoughness={0.03}
              onBeforeCompile={turnHead}
            />
          </mesh>
          <mesh geometry={glasses.lenses}>
            <meshBasicMaterial
              map={lensLogo}
              transparent
              depthWrite={false}
              polygonOffset
              polygonOffsetFactor={-1}
              polygonOffsetUnits={-2}
              onBeforeCompile={turnHead}
            />
          </mesh>
          {(
            [
              ['left', ARM_PINK],
              ['leftText', ARM_PINK],
              ['right', ARM_ORANGE],
              ['rightText', ARM_ORANGE],
            ] as const
          ).map(([part, color]) => (
            <mesh key={part} geometry={glasses[part]}>
              <meshStandardMaterial
                color={color}
                roughness={0.95}
                envMapIntensity={PRINTED_SKY}
                onBeforeCompile={turnHead}
              />
            </mesh>
          ))}
        </group>
      )}
      <SleepMaskProp
        leftEye={leftEye}
        rightEye={rightEye}
        skin={skin}
        amounts={amount}
      />
      <mesh ref={wireRef} geometry={wire} visible={false}>
        {/* In the head's own indigo (theme/head.json): the peach it was
            hardly showed on the light sky. */}
        <meshBasicMaterial
          color={head.indigo}
          vertexColors
          wireframe
          transparent
          depthWrite={false}
          onBeforeCompile={skinShader}
        />
      </mesh>
      <TexasTechProps spread={spread} amounts={amount} skin={skin} />
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
