import { useFrame } from '@react-three/fiber';
import { RefObject, useMemo, useRef } from 'react';
import { BufferGeometry, Group, Material, Mesh } from 'three';

import head from '@/theme/head.json';

import { turnHead } from './headTurn';
import { fadeNeck } from './neckFade';
import { StoryProp } from './storyCue';
import { useOnceCued } from './useOnceCued';
import { loadPatch, wireParts } from './wireSeam';

// The head's own wireframe, its expressions and all, in place of its skin
// (this website's chapter of the story), in the head's own indigo
// (theme/head.json): the peach it was hardly showed on the light sky.

// How far the head is only its wireframe, 0 to 1.
const wireShown = { value: 0 };

// Fades the skin and its lining away as the wireframe comes (MyHead.tsx, each
// frame), and with them the mouth and the eyeballs (`bare`), which showed
// bare inside the wireframe. The wireframe's own triangles hide the lines
// behind them then, not the skin's: round the neck the two differ
// (wireSeam.ts), and the skin would cover lines there.
export function fadeSkin(skin: Mesh, lining: Mesh, bare: Mesh[]) {
  const left = 1 - wireShown.value;
  for (const mesh of [skin, lining]) (mesh.material as Material).opacity = left;
  (skin.material as Material).depthWrite = left > 0.99;
  for (const mesh of bare) mesh.visible = left > 0.5;
}

const skinShader: Material['onBeforeCompile'] = (shader) => {
  turnHead(shader);
  fadeNeck(shader);
};

export default function WireHead({
  skin,
  skinRef,
  amounts,
}: {
  skin: BufferGeometry;
  skinRef: RefObject<Mesh | null>;
  amounts: RefObject<Record<StoryProp, number>>;
}) {
  const ref = useRef<Group>(null);
  const patch = useOnceCued(loadPatch);
  const parts = useMemo(
    () => patch && Object.values(wireParts(skin, patch)),
    [skin, patch],
  );
  useFrame(() => {
    wireShown.value = parts ? amounts.current.wireframe : 0;
    ref.current!.visible = wireShown.value > 0.01;
    for (const child of ref.current!.children) {
      const part = child as Mesh;
      (part.material as Material).opacity = wireShown.value;
      part.morphTargetInfluences = skinRef.current?.morphTargetInfluences ?? [];
    }
  });
  return (
    <group ref={ref} visible={false}>
      {parts?.flatMap((geometry, k) => [
        // Drawn first, in depth alone, a little further off than its lines.
        <mesh key={`${k} hides`} geometry={geometry}>
          <meshBasicMaterial
            colorWrite={false}
            polygonOffset
            polygonOffsetFactor={1}
            polygonOffsetUnits={2}
            onBeforeCompile={skinShader}
          />
        </mesh>,
        <mesh key={k} geometry={geometry}>
          <meshBasicMaterial
            color={head.indigo}
            wireframe
            transparent
            depthWrite={false}
            onBeforeCompile={skinShader}
          />
        </mesh>,
      ])}
    </group>
  );
}
