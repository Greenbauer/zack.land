import { Effects } from '@react-three/drei';
import {
  extend,
  ThreeElement,
  useFrame,
  useLoader,
  useThree,
} from '@react-three/fiber';
import { useEffect, useRef, useState } from 'react';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { HorizontalBlurShader } from 'three/addons/shaders/HorizontalBlurShader.js';
import { VerticalBlurShader } from 'three/addons/shaders/VerticalBlurShader.js';
import { LUTCubeLoader, LUTPass } from 'three-stdlib';

import { leavesTrail } from '@/components/pointerInk';

import {
  FOCUS_BLUR_PX,
  FOCUS_BLUR_SECONDS,
  formFocused,
  menuOpen,
  menuShown,
  TitlePass,
} from './focusBlur';
import { GlassPass, GlassTintPass, tintStrength } from './glass';
import { findCards, findFields, pageFade } from './glassCards';
import { CardTints, Rgb, skyOf, skyPoints } from './glassTint';
import { photoLenses } from './photoLens';
import { TrailPass } from './pointerTrail';
import { drawsInSoftware, renderQuality } from './quality';
import { isSmall } from './smallScreen';
import usePixelReader from './usePixelReader';

extend({ LUTPass, OutputPass });

declare module '@react-three/fiber' {
  interface ThreeElements {
    lUTPass: ThreeElement<typeof LUTPass>;
    outputPass: ThreeElement<typeof OutputPass>;
  }
}

// three's blur shaders spread their nine samples to a standard deviation of
// 2.7 steps.
const BLUR_STEPS = 2.7;
// How often, in frames, the sky around the cards is read back to choose
// their sides (their tints follow the sky every frame, in glass.ts).
const SAMPLE_EVERY = 6;

export default function Grading() {
  const { texture3D } = useLoader(
    LUTCubeLoader,
    '/background/environment/cubicle-99.cube',
  );
  const get = useThree((state) => state.get);
  // The composer's targets are made once, so their smoothing is chosen once,
  // by the window's size as the scene loads.
  const [samples] = useState(() => {
    const { width, height } = get().size;
    return renderQuality(width, height, drawsInSoftware()).samples;
  });
  const [across] = useState(() => new ShaderPass(HorizontalBlurShader));
  const [down] = useState(() => new ShaderPass(VerticalBlurShader));
  const [glass] = useState(() => new GlassPass());
  const [tint] = useState(() => new GlassTintPass(glass));
  const [titles] = useState(() => new TitlePass(get));
  const [tints] = useState(() => new CardTints());
  const [trail] = useState(() => new TrailPass());
  const frame = useRef(0);
  const reader = usePixelReader();
  // How far the focus blur has come in, from 0 to 1.
  const blur = useRef(0);

  // New cards take the sky's side as they are added, ahead of their first
  // paint (a MutationObserver runs before it).
  useEffect(() => {
    const observer = new MutationObserver(() => {
      for (const card of document.querySelectorAll<HTMLElement>(
        'section, [data-glass]',
      ))
        tints.place(card);
    });
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [tints]);

  // The pointer's trail through the scene (pointerTrail.ts).
  useEffect(() => {
    const move = (event: PointerEvent) => {
      if (leavesTrail(event)) trail.move(event.clientX, event.clientY);
    };
    addEventListener('pointermove', move, { passive: true });
    return () => removeEventListener('pointermove', move);
  }, [trail]);

  useFrame(({ gl, size }, delta) => {
    // The cards' frosting follows them every frame.
    Object.assign(glass, {
      cards: findCards(gl.domElement),
      fields: findFields(gl.domElement),
      fade: pageFade(size.height),
      calm: isSmall(size.width, size.height),
    });
    // The glass over any photos under the cards (photoLens.ts).
    photoLenses(
      glass.cards.map(({ element }) => element),
      isSmall(size.width, size.height),
    );
    // The cards' glass is never tinted, not even to keep its text within the
    // card's bounds: it shows no colour the sky behind it does not. Only
    // the open phone menu's pane (data-glass-deep) takes its deep tint, so
    // its lenses show. So the tint pass runs only while that pane is on
    // screen, open or fading away, and otherwise the graded frame goes out
    // as is.
    const deep = menuShown();
    Object.assign(tint, {
      enabled: deep,
      glasses: deep
        ? glass.cards.map(({ element }) => tints.shown(element, delta))
        : [],
      strength: tintStrength(size.width, size.height),
    });
    const toward = formFocused() ? 1 : 0;
    const step = delta / FOCUS_BLUR_SECONDS;
    blur.current += Math.max(Math.min(toward - blur.current, step), -step);
    const spacing = (blur.current * FOCUS_BLUR_PX) / BLUR_STEPS;
    const enabled = blur.current > 0;
    Object.assign(across.uniforms.h!, { value: spacing / size.width });
    Object.assign(down.uniforms.v!, { value: spacing / size.height });
    Object.assign(across, { enabled });
    Object.assign(down, { enabled });
    Object.assign(titles, { enabled: !menuOpen() });
  });

  // Every few frames, once the frame is drawn (priority 2, as
  // BackdropSampler), each card's tint is aimed at the sky around it, when
  // that has been read back (pixelReader.ts).
  useFrame(({ gl }) => {
    frame.current = (frame.current + 1) % SAMPLE_EVERY;
    if (frame.current || reader.busy) return;
    const reads = glass.cards
      .map(({ element }) => ({
        element,
        points: skyPoints(gl.domElement, element),
      }))
      .filter(({ points }) => points.length);
    for (const { points } of reads)
      for (const { x, y } of points) reader.read({ x, y, width: 1, height: 1 });
    reader.send((pixels) => {
      let at = 0;
      for (const { element, points } of reads) {
        const sky = pixels
          .slice(at, (at += points.length))
          .map((p): Rgb => [p[0]!, p[1]!, p[2]!]);
        tints.aim(element, skyOf(sky));
      }
    });
  }, 2);

  // Since three r153 the renderer only tone maps to the screen, so the
  // OutputPass puts back the tone mapping the sandbox (three r148) got for
  // free. The focus blur comes first, then the titles over it, then the
  // pointer's trail through both, then the cards' frosting (glass.ts), so
  // the glass sits still over the trail and the colour grading falls on all
  // alike; the cards' tint goes on last, over the graded frame.
  return (
    <Effects disableGamma multisamping={samples}>
      <primitive object={across} />
      <primitive object={down} />
      <primitive object={titles} />
      <primitive object={trail} />
      <primitive object={glass} />
      <outputPass />
      <lUTPass args={[{ lut: texture3D, intensity: 0.75 }]} />
      <primitive object={tint} />
    </Effects>
  );
}
