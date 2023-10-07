'use client';

import { PerspectiveCamera } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import { Suspense } from 'react';
import { PerspectiveCamera as PerspectiveCameraType } from 'three';

import useMousePosition from '@/hooks/useMousePosition';
import useWindowSize from '@/hooks/useWindowSize';

import Spinner from '../Spinner';
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
        <Canvas flat className="bg-black">
          <MyHead lookPositionStart={lookPositionStart} />
          <RetroFrame />
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
