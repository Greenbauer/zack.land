'use client';

import { Environment, PerspectiveCamera, useProgress } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import { Suspense } from 'react';
import { PerspectiveCamera as PerspectiveCameraType } from 'three';

import useMousePosition from '@/hooks/useMousePosition';
import useWindowSize from '@/hooks/useWindowSize';

import Spinner from '../Spinner';
import BackdropSampler from './BackdropSampler';
import Grading from './Grading';
import MyHead, { Point } from './MyHead';
import { renderQuality } from './quality';
import Sky from './Sky';
import TitleName from './TitleName';

export default function Background() {
  const mousePosition = useMousePosition();
  const { width, height } = useWindowSize();
  const { active: isLoading } = useProgress();

  // Read by the head every frame: the pointer moves without re-rendering
  // (useMousePosition).
  const lookPositionStart = (): Point => ({
    x: (mousePosition.x - width / 3) * 0.5,
    y: (mousePosition.y - height / 2) * 0.5,
  });

  const handleCameraUpdate = (camera: PerspectiveCameraType): void => {
    camera.setViewOffset(width, height, width / 4, 0, width, height);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  };

  // The loading boundary sits inside the Canvas: a suspense that escapes it
  // unmounts the Canvas mid-load, which loses its WebGL context in dev.
  return (
    <div className="fixed left-0 top-0 -z-50 flex size-full overflow-hidden">
      {isLoading && (
        <div className="fixed flex size-full items-center justify-center">
          <Spinner />
        </div>
      )}
      {/* Before the sky loads, the canvas shows a lavender near the dawn sky's
          middle, so the title over it reads the same from the first frame. */}
      {/* No smoothing on the canvas itself: the scene is drawn and smoothed
          in the colour grading's targets (Grading.tsx), and the canvas only
          receives its last full-screen pass. */}
      <Canvas
        className="bg-[#6864a8]"
        dpr={renderQuality(width, height).dpr}
        gl={{ antialias: false }}
      >
        <Suspense fallback={null}>
          <ambientLight intensity={Math.PI} />
          <spotLight
            intensity={0.5 * Math.PI}
            decay={0}
            angle={0.2}
            penumbra={1}
            position={[250, 750, 500]}
          />
          <MyHead
            lookPositionStart={lookPositionStart}
            pointer={mousePosition}
          />
          <Sky />
          <Grading />
          <BackdropSampler />
          <TitleName />
          <Environment
            files="/background/environment/kiara_1_dawn_1k.hdr"
            background
            backgroundBlurriness={0.6}
            backgroundIntensity={0.45}
          />
        </Suspense>
        <PerspectiveCamera
          makeDefault
          position={[0, 0, 250]}
          onUpdate={handleCameraUpdate}
        />
      </Canvas>
    </div>
  );
}
