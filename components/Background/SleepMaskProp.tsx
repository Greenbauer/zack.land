import { useFrame } from '@react-three/fiber';
import { RefObject, useMemo, useRef } from 'react';
import {
  BufferGeometry,
  DoubleSide,
  Group,
  Material,
  Mesh,
  Vector3,
} from 'three';

import { turnHead } from './headTurn';
import { maskPrint } from './maskPrint';
import { centre, onSkull } from './skull';
import { headProfile, sleepMask } from './sleepMask';
import { snoreZ } from './snoreZ';
import type { StoryProp } from './storyCue';

// The smart bed's chapter, on the head itself (StoryProps.tsx): a sleep mask
// that slides down onto it as it shuts its eyes, and Zs floating up beside it.
// `amounts` is how far in each prop is.

// The Zs floating up from the sleeping head: how many at once, and how
// long each takes to rise and fade (seconds).
const SNORE_ZS = 3;
const SNORE_SECONDS = 3.6;

export default function SleepMaskProp({
  leftEye,
  rightEye,
  skin,
  amounts,
}: {
  leftEye: BufferGeometry;
  rightEye: BufferGeometry;
  skin: BufferGeometry;
  amounts: RefObject<Record<StoryProp, number>>;
}) {
  // The smart bed's sleep mask (sleepMask.ts): its pad, lashes and strap,
  // fitted to the head's own shape, its satin (maskPrint.ts), and the Zs that float up from the sleeper.
  const mask = useMemo(() => {
    const l = centre(leftEye);
    const r = centre(rightEye);
    const eyes = l.clone().add(r).multiplyScalar(0.5);
    const spread = l.distanceTo(r);
    const profile = headProfile(
      skin.getAttribute('position').array,
      eyes,
      spread,
    );
    const { pad, lashes, strap } = sleepMask(profile);
    return {
      pad: onSkull(pad),
      lashes: onSkull(lashes),
      strap: onSkull(strap),
      print: maskPrint(),
      z: snoreZ(spread * 0.42),
      // Where the Zs rise from: beside the head on the side away from the
      // card, level with the brow, so they stay clear of the card and the
      // top of the window.
      from: new Vector3(eyes.x - spread * 1.6, eyes.y + spread * 0.9, eyes.z),
      spread,
    };
  }, [leftEye, rightEye, skin]);
  const maskRef = useRef<Group>(null);
  const snoreRef = useRef<Group>(null);

  useFrame(() => {
    const now = performance.now() / 1000;
    // It slides down onto the eyes from above the head, slowing as it lands,
    // and back up as its chapter goes, as the sunglasses and the cap do.
    const sleeping = amounts.current.sleepmask;
    if (maskRef.current) {
      maskRef.current.visible = sleeping > 0.01;
      maskRef.current.position.y = (1 - sleeping) ** 2 * mask.spread * 9;
    }
    // Once it is on, Zs float up from the sleeper, one after another, each
    // growing as it rises and fading away.
    if (snoreRef.current) {
      snoreRef.current.visible = sleeping > 0.5;
      snoreRef.current.children.forEach((z, k) => {
        const t = (now / SNORE_SECONDS + k / SNORE_ZS) % 1;
        z.position
          .copy(mask.from)
          .add(
            new Vector3(
              -mask.spread * (0.3 * t + 0.12 * Math.sin(t * 6 + k)),
              mask.spread * 1.3 * t,
              0,
            ),
          );
        z.scale.setScalar(0.5 + t);
        z.rotation.z = -0.25 + 0.3 * Math.sin(t * 4 + k);
        ((z as Mesh).material as Material).opacity =
          Math.min(1, t * 5) * (1 - t);
      });
    }
  });

  return (
    <>
      {/* A puffy satin pad cut to its print's outline, long dark lashes,
          and a thin plum elastic. */}
      <group ref={maskRef} visible={false}>
        <mesh geometry={mask.pad}>
          <meshPhysicalMaterial
            map={mask.print}
            alphaTest={0.5}
            side={DoubleSide}
            roughness={0.45}
            sheen={0.9}
            sheenRoughness={0.3}
            sheenColor="#ffe3ea"
            envMapIntensity={0.35}
            onBeforeCompile={turnHead}
          />
        </mesh>
        <mesh geometry={mask.lashes}>
          <meshStandardMaterial
            color="#2a0f22"
            roughness={0.6}
            envMapIntensity={0.3}
            onBeforeCompile={turnHead}
          />
        </mesh>
        <mesh geometry={mask.strap}>
          <meshStandardMaterial
            color="#4a2240"
            roughness={0.85}
            side={DoubleSide}
            envMapIntensity={0.3}
            onBeforeCompile={turnHead}
          />
        </mesh>
      </group>
      <group ref={snoreRef} visible={false}>
        {Array.from({ length: SNORE_ZS }, (_, k) => (
          <mesh key={k} geometry={mask.z}>
            {/* Unlit, in a deep rose that stands out on the lavender sky. */}
            <meshBasicMaterial color="#8c1650" transparent depthWrite={false} />
          </mesh>
        ))}
      </group>
    </>
  );
}
