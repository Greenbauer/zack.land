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
  SRGBColorSpace,
  TextureLoader,
  Vector3,
} from 'three';

import head from '@/theme/head.json';

import { noseBridge, openAngle, swingArm, templeWidth } from './glassesFit';
import { Glasses, loadGlasses } from './glassesGeometry';
import { headMood } from './headMood';
import { turnHead } from './headTurn';
import { maskPrint } from './maskPrint';
import { fadeNeck } from './neckFade';
import { phoneShown } from './PhoneCall';
import { sleepMask } from './sleepMask';
import { isStill } from './stillScene';
import { StoryProp } from './storyCue';
import { propTarget } from './storyProp';
import TexasTechProps from './TexasTechProps';

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

// Where the scanned head is joined to the body below it (JOIN in
// scripts/build-head.mjs): a slanted line, its height at a depth z the
// SEAM's height at the back plus SLOPE for each unit forward. The stitched
// band that closes it is thin triangles, which in the wireframe drew a
// dense line round the neck; the wireframe fades out over WIRE_FADE units
// above it, so the head's wireframe ends cleanly under the chin.
const SEAM = { z: -56, y: -38, slope: (-76 + 38) / (15 + 56) };
const WIRE_FADE = [4, 18];
const wireShader: Material['onBeforeCompile'] = (shader, renderer) => {
  skinShader(shader, renderer);
  shader.fragmentShader = shader.fragmentShader.replace(
    '#include <opaque_fragment>',
    `#include <opaque_fragment>
      float aboveSeam = vLocal.y - (${SEAM.y.toFixed(1)} + (vLocal.z - (${SEAM.z.toFixed(1)})) * ${SEAM.slope.toFixed(4)});
      gl_FragColor.a *= smoothstep(${WIRE_FADE[0]!.toFixed(1)}, ${WIRE_FADE[1]!.toFixed(1)}, aboveSeam);`,
  );
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

// The Banner Eyewear sunglasses (glassesGeometry.ts) on the head as the real
// pair sits on a face (the model photo in the Banner Eyewear post): the model
// whole, scaled so its front is as wide as the head at the temples, its
// lenses level with the eyes, its bridge resting on the nose, and each arm
// swung open at its hinge just enough to clear the side of the head
// (glassesFit.ts), every part carried by the skull. Scaled to clear the head
// with its arms shut it came out far too big; scaled to the eyes, too narrow.
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
  const scale = temples / (frame.max.x - frame.min.x);
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
  const placed = (geometry: BufferGeometry) => {
    const g = geometry.clone();
    g.translate(0, -lift, -bridgeBack);
    g.scale(scale, scale, scale);
    g.translate(at.x, at.y, at.z);
    g.computeBoundingBox();
    return g;
  };
  // Each arm and its word swing open together about the arm's hinge: its
  // front end's outer edge.
  const arm = (side: 1 | -1, track: BufferGeometry, word: BufferGeometry) => {
    const [armPlaced, wordPlaced] = [placed(track), placed(word)];
    const box = armPlaced.boundingBox!;
    const hinge = { x: side > 0 ? box.max.x : box.min.x, z: box.max.z };
    const angle = openAngle(
      head,
      [
        ...armPlaced.getAttribute('position').array,
        ...wordPlaced.getAttribute('position').array,
      ],
      hinge,
      side,
      spread * 0.03,
    );
    return [armPlaced, wordPlaced].map((g) =>
      onSkull(swingArm(g, hinge, side, angle)),
    ) as [BufferGeometry, BufferGeometry];
  };
  const [leftArm, leftText] = arm(1, glasses.left, glasses.leftText);
  const [rightArm, rightText] = arm(-1, glasses.right, glasses.rightText);
  return {
    frame: onSkull(placed(glasses.frame)),
    lenses: onSkull(placed(glasses.lenses)),
    left: leftArm,
    right: rightArm,
    leftText,
    rightText,
    drop: spread * 5,
  };
}

// How much of the sky's light the printed frame and arms take: little, so
// they keep their own colours.
const PRINTED_SKY = 0.3;

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
  // The smart bed's sleep mask, cast from the skin (sleepMask.ts), the head's
  // middle it is laid round, and its print (maskPrint.ts).
  const mask = useMemo(() => {
    const l = centre(leftEye);
    const r = centre(rightEye);
    const eyes = l.clone().add(r).multiplyScalar(0.5);
    const { array } = skin.getAttribute('position');
    const geometry = onSkull(sleepMask(array, eyes, l.distanceTo(r)));
    return {
      geometry,
      middle: geometry.userData.middle as Vector3,
      print: maskPrint(),
    };
  }, [leftEye, rightEye, skin]);
  const maskRef = useRef<Mesh>(null);
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

    // The sleep mask slides down onto the eyes from the forehead.
    const sleeping = amount.current.sleepmask;
    if (maskRef.current) {
      maskRef.current.visible = sleeping > 0.01;
      // It shrinks onto the head from a little larger, about the head's
      // middle, so no part of it passes through the face on the way.
      const size = 1 + 0.35 * (1 - sleeping) ** 2;
      maskRef.current.scale.setScalar(size);
      maskRef.current.position.copy(mask.middle).multiplyScalar(1 - size);
    }

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
              color="#8f8e89"
              roughness={0.85}
              envMapIntensity={PRINTED_SKY}
              onBeforeCompile={turnHead}
            />
          </mesh>
          <mesh geometry={glasses.lenses}>
            <meshPhysicalMaterial
              color="#2a2470"
              metalness={0.9}
              roughness={0.08}
              clearcoat={1}
              clearcoatRoughness={0.05}
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
              ['left', '#d742a0'],
              ['leftText', '#d742a0'],
              ['right', '#f57a3d'],
              ['rightText', '#f57a3d'],
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
      {/* A puffy satin pad with its print, and a thin plum elastic. */}
      <mesh ref={maskRef} geometry={mask.geometry} visible={false}>
        <meshPhysicalMaterial
          attach="material-0"
          map={mask.print}
          roughness={0.5}
          sheen={0.8}
          sheenRoughness={0.35}
          sheenColor={head.peach}
          envMapIntensity={0.4}
          onBeforeCompile={turnHead}
        />
        <meshStandardMaterial
          attach="material-1"
          color="#4a2240"
          roughness={0.8}
          envMapIntensity={0.3}
          onBeforeCompile={turnHead}
        />
      </mesh>
      <mesh ref={wireRef} geometry={skin} visible={false}>
        {/* In the head's own indigo (theme/head.json): the peach it was
            hardly showed on the light sky. */}
        <meshBasicMaterial
          color={head.indigo}
          wireframe
          transparent
          depthWrite={false}
          onBeforeCompile={wireShader}
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
