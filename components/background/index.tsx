import { Suspense, useState, useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import { PerspectiveCamera } from '@react-three/drei'
import { PerspectiveCamera as PerspectiveCameraType } from 'three'
import useWindowSize from '@/hooks/useWindowSize'
import MyHead, { Mouse } from './myHead'
import RetroFrame from './retroFrame'
import styles from '@/styles/Background.module.scss'
import useMousePosition from '@/hooks/useMousePosition'

export default function Background() {
  const mousePosition = useMousePosition()
  const { width, height } = useWindowSize();

  const mouse: Mouse = {
    isMoving: true,
    x: (mousePosition.x - (width / 2)) * 0.7,
    y: (mousePosition.y - (height / 2)) * 0.5,
  }

  const handleCameraUpdate = (camera: PerspectiveCameraType) => {
    camera.setViewOffset(
      width,
      height,
      width / 4,
      0,
      width,
      height,
    )
    camera.aspect = width / height
    camera.updateProjectionMatrix()
  }

  return (
    <div className={styles.wrapper}>
      <Suspense fallback={null}>
        <Canvas flat className={styles.canvas}>
          <MyHead mouse={mouse} />
          <RetroFrame />
          <PerspectiveCamera
            makeDefault
            position={[0, 0, 250]}
            onUpdate={handleCameraUpdate}
          />
        </Canvas>
      </Suspense>
    </div>
  )
}