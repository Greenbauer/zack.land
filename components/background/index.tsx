import { PerspectiveCamera } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import { Suspense } from 'react';
import { PerspectiveCamera as PerspectiveCameraType } from 'three';

import useMousePosition from '@/hooks/useMousePosition';
import useWindowSize from '@/hooks/useWindowSize';

import Spinner from '../spinner';
import styles from './background.module.scss';
import MyHead, { Point } from './myHead';
import RetroFrame from './retroFrame';

export default function Background() {
  const mousePosition = useMousePosition();
  const { width, height } = useWindowSize();

  const lookPositionStart: Point = {
    x: (mousePosition.x - width / 3) * 0.5,
    y: (mousePosition.y - height / 2) * 0.5,
  };

  const handleCameraUpdate = (camera: PerspectiveCameraType) => {
    camera.setViewOffset(width, height, width / 4, 0, width, height);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  };

  return (
    <div className={styles.wrapper}>
      <Suspense fallback={<Spinner />}>
        <Canvas flat className={styles.canvas}>
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
