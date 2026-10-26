'use client';

import { Environment, PerspectiveCamera } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import { Suspense } from 'react';
import { PerspectiveCamera as PerspectiveCameraType } from 'three';

import useMousePosition from '@/hooks/useMousePosition';
import useWindowSize from '@/hooks/useWindowSize';

import Spinner from '../Spinner';
import Grading from './Grading';
import MyHead, { Point } from './MyHead';
import RetroFrame from './RetroFrame';

export default function Background() {
  const mousePosition = useMousePosition();
  const { width, height } = useWindowSize();

  const lookPositionStart: Point = {
    x: (mousePosition.x - width / 3) * 0.5,
    y: (mousePosition.y - height / 2) * 0.5,
  };

  const handleCameraUpdate = (camera: PerspectiveCameraType): void => {
    camera.setViewOffset(width, height, width / 4, 0, width, height);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  };

  return (
    <div className="fixed left-0 top-0 -z-50 flex h-full w-full overflow-hidden">
      <Suspense
        fallback={
          <div className="fixed flex h-full w-full items-center justify-center">
            <Spinner />
          </div>
        }
      >
        <Canvas className="bg-black">
          <ambientLight intensity={Math.PI} />
          <spotLight
            intensity={0.5 * Math.PI}
            decay={0}
            angle={0.2}
            penumbra={1}
            position={[250, 750, 500]}
          />
          <MyHead lookPositionStart={lookPositionStart} />
          <RetroFrame />
          <Grading />
          <Environment
            files="/background/environment/kiara_1_dawn_1k.hdr"
            background
            backgroundBlurriness={0.6}
            backgroundIntensity={0.45}
          />
          <PerspectiveCamera
            makeDefault
            position={[0, 0, 250]}
            onUpdate={handleCameraUpdate}
          />
        </Canvas>
      </Suspense>
    </div>
  );
}
