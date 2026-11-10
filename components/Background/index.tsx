'use client';

import { PerspectiveCamera } from '@react-three/drei';
import { Canvas, useFrame } from '@react-three/fiber';
import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { PerspectiveCamera as PerspectiveCameraType } from 'three';

import useMousePosition from '@/hooks/useMousePosition';
import useWindowSize from '@/hooks/useWindowSize';

import BackdropSampler from './BackdropSampler';
import Grading from './Grading';
import HeadFraming from './HeadFraming';
import { lookOrigin } from './headPlace';
import { CAMERA_HOME, endIntro, startIntro, stepIntro } from './intro';
import Loader from './Loader';
import MyHead, { Point } from './MyHead';
import {
  askDrawsInSoftware,
  drawsInSoftware,
  markSoftware,
  renderQuality,
  slowFrames,
  useDrawsInSoftware,
} from './quality';
import {
  frameSettler,
  markSceneDrawn,
  markSceneReady,
  READY_AT_MOST_MS,
} from './sceneReady';
import Sky from './Sky';
import SkyEnvironment from './SkyEnvironment';
import TitleName from './TitleName';

export default function Background() {
  const mousePosition = useMousePosition();
  const { width, height } = useWindowSize();
  const software = useDrawsInSoftware();

  // Read by the head every frame: the pointer moves without re-rendering
  // (useMousePosition).
  const lookPositionStart = (): Point => ({
    x: (mousePosition.x - lookOrigin(width)) * 0.5,
    y: (mousePosition.y - height / 2) * 0.5,
  });

  // The dark screen waits for the scene no longer than READY_AT_MOST_MS, as
  // without WebGL it never draws (sceneReady.ts, intro.ts).
  useEffect(() => {
    const wait = setTimeout(() => {
      markSceneReady();
      endIntro();
    }, READY_AT_MOST_MS);
    return () => clearTimeout(wait);
  }, []);

  // Whether the scene has started loading, its canvas and WebGL context
  // included, once it is known whether WebGL is drawn in software (which
  // sets the canvas's pixels, quality.ts). That is asked off the main
  // thread where the browser can draw there (askDrawsInSoftware): opening
  // a context on it stalls the page.
  const [isSceneOn, setIsSceneOn] = useState(false);
  useEffect(() => {
    let isGone = false;
    askDrawsInSoftware().then((software) => {
      if (isGone) return;
      if (software) document.documentElement.setAttribute('data-software', '');
      setIsSceneOn(true);
    });
    return () => {
      isGone = true;
    };
  }, []);

  const handleCameraUpdate = (camera: PerspectiveCameraType): void => {
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  };

  // The loading boundary sits inside the Canvas: a suspense that escapes it
  // unmounts the Canvas mid-load, which loses its WebGL context in dev.
  return (
    <>
      <Loader />
      <div
        data-scene
        className="fixed left-0 top-0 -z-50 flex size-full overflow-hidden bg-[#6864a8]"
      >
        {/* Before the sky loads, the canvas (and before it, the scene's own
          box) shows a lavender near the dawn sky's middle, so the title over
          it reads the same from the first frame. */}
        {/* No smoothing on the canvas itself: the scene is drawn and smoothed
          in the colour grading's targets (Grading.tsx), and the canvas only
          receives its last full-screen pass. */}
        {isSceneOn && (
          <Canvas
            className="bg-[#6864a8]"
            dpr={renderQuality(width, height, software).dpr}
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
              <HeadFraming />
              <MyHead
                lookPositionStart={lookPositionStart}
                pointer={mousePosition}
              />
              <Sky />
              <Grading />
              <BackdropSampler />
              <TitleName />
              <SceneReady />
              <SkyEnvironment />
            </Suspense>
            <PerspectiveCamera
              makeDefault
              position={[...CAMERA_HOME]}
              onUpdate={handleCameraUpdate}
            />
          </Canvas>
        )}
      </div>
    </>
  );
}

// Marks the scene drawn at its first frame once it has loaded (inside the
// Suspense), and ready once it has drawn a few smooth frames
// (sceneReady.ts), when the camera starts out of the head's mouth (intro.ts):
// unless motion is reduced or WebGL is drawn in software, where the dark
// screen only fades. Its first frames, if slow enough, show it is drawn in
// software (quality.ts).
function SceneReady() {
  const settled = useMemo(() => frameSettler(), []);
  const slow = useMemo(() => slowFrames(), []);
  const isDone = useRef(false);
  useFrame(({ clock }, delta) => {
    markSceneDrawn();
    stepIntro(clock.elapsedTime);
    if (slow(delta)) markSoftware();
    if (isDone.current || !settled(delta)) return;
    isDone.current = true;
    markSceneReady();
    startIntro(
      clock.elapsedTime,
      !drawsInSoftware() &&
        !matchMedia('(prefers-reduced-motion: reduce)').matches,
    );
  });
  return null;
}
