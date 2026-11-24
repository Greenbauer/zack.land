import { useFrame } from '@react-three/fiber';
import { RefObject, useMemo, useRef } from 'react';
import {
  BufferGeometry,
  Euler,
  Group,
  Mesh,
  MeshPhysicalMaterial,
  SRGBColorSpace,
  TextureLoader,
} from 'three';

import { fitGlasses } from './fitGlasses';
import { loadGlasses } from './glassesGeometry';
import { headMood } from './headMood';
import { turnHead } from './headTurn';
import { phoneShown } from './PhoneCall';
import { centre } from './skull';
import SleepMaskProp from './SleepMaskProp';
import { isStill } from './stillScene';
import { StoryProp } from './storyCue';
import { PHONE_SECONDS, propTarget } from './storyProp';
import TexasTechProps from './TexasTechProps';
import { useOnceCued } from './useOnceCued';
import WireHead from './WireHead';

// What a chapter of the home page's story brings into the scene around the
// head (components/Home/chapters.ts, through headMood.cue): sunglasses that
// drop onto its face, a sleep mask (SleepMaskProp.tsx), its own wireframe in
// place of its skin (WireHead.tsx), a graduation cap and flying tortillas
// (TexasTechProps.tsx), and a phone that takes the head's place (PhoneCall.tsx, drawn beside the head by MyHead.tsx, which
// this tells how far in it is).
// Each eases in as its chapter arrives (propTarget, storyProp.ts) and out
// as it goes; with reduced motion none shows. The sunglasses, the cap and
// the wireframe turn with the head (turnHead), as its eyes do. What it
// shows is named on the page as data-story-prop on <html> (empty for none),
// each prop once it is well in.

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

// The sky the lenses mirror, turned so the dawn's horizon is in them whichever
// way the scene's own sky is turned: half the time that has its dark side
// behind the camera, and they showed a flat navy.
const LENS_SKY = new Euler(0.6, -1.19, 0);

// How quickly a prop eases in and out (per second).
const IN_RATE = 3;
const OUT_RATE = 3.5;

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
  // The head's own measure: the distance between its eyes.
  const spread = useMemo(
    () => Math.abs(centre(rightEye).x - centre(leftEye).x),
    [leftEye, rightEye],
  );
  // The sunglasses, fetched once the story has started (a chapter's cue),
  // well before Banner Eyewear's chapter comes round.
  const model = useOnceCued(loadGlasses);
  // The builder's own lens logo (public/story/lens, from banner-builder's
  // Textures/Lens), loaded with the glasses.
  const lensLogo = useMemo(() => {
    if (!model) return null;
    const texture = new TextureLoader().load('/story/lens/logo.png');
    texture.colorSpace = SRGBColorSpace;
    return texture;
  }, [model]);
  const glasses = useMemo(
    () => model && fitGlasses(model, centre(leftEye), centre(rightEye)),
    [model, leftEye, rightEye],
  );
  const amount = useRef<Record<StoryProp, number>>({
    sunglasses: 0,
    sleepmask: 0,
    wireframe: 0,
    tortillas: 0,
    phone: 0,
  });
  const glassesRef = useRef<Group>(null);
  const mirrorRef = useRef<MeshPhysicalMaterial>(null);

  useFrame(({ scene }, delta) => {
    const cue = headMood.cue;
    const still = isStill();
    for (const prop of Object.keys(amount.current) as StoryProp[]) {
      const target = still ? 0 : propTarget(cue, prop, amount.current);
      const was = amount.current[prop];
      const rate = target > was ? IN_RATE : OUT_RATE;
      amount.current[prop] =
        prop === 'phone'
          ? // At one pace: its swap with the head eases each slide itself.
            Math.min(
              1,
              Math.max(
                0,
                was + Math.sign(target - was) * (delta / PHONE_SECONDS),
              ),
            )
          : was + (target - was) * Math.min(1, rate * delta);
    }
    const { sunglasses: wearing } = amount.current;
    nameDrawn(amount.current, !!glasses);
    phoneShown.value = amount.current.phone;

    // The sunglasses drop from above onto the face, slowing as they land.
    if (glassesRef.current && glasses) {
      glassesRef.current.visible = wearing > 0.01;
      glassesRef.current.position.y = (1 - wearing) ** 2 * glasses.drop;
    }
    const mirror = mirrorRef.current;
    if (mirror && mirror.envMap !== scene.environment) {
      mirror.envMap = scene.environment;
      mirror.needsUpdate = true;
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
              mirror of the dawn (LENS_SKY). */}
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
              ref={mirrorRef}
              envMapRotation={LENS_SKY}
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
      <WireHead skin={skin} skinRef={skinRef} amounts={amount} />
      <TexasTechProps spread={spread} amounts={amount} skin={skin} />
    </>
  );
}
