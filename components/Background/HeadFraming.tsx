'use client';

import { useFrame } from '@react-three/fiber';
import { useEffect, useRef } from 'react';
import { PerspectiveCamera } from 'three';

import { framedHead, glide, headCentre } from './headPlace';

// How often the page is measured for the head's place, in milliseconds.
const MEASURE_MS = 300;

// Moves the camera so the head's middle sits where headCentre says, gliding
// there (glide, a damped spring) when the page or the window changes. The page is measured a few times
// a second, not every frame: the left edge of whatever marked data-head-avoid
// is showing. While none shows (a post's card between fades), the head stays
// where it is. Renders nothing.
export default function HeadFraming() {
  const target = useRef<number | null>(null);

  useEffect(() => {
    const still = matchMedia('(prefers-reduced-motion: reduce)');
    const measure = () => {
      const avoid = [
        ...document.querySelectorAll<HTMLElement>('[data-head-avoid]'),
      ];
      const shown = avoid
        .filter((el) => el.checkVisibility({ visibilityProperty: true }))
        .map((el) => el.getBoundingClientRect())
        .filter((box) => box.bottom > 0 && box.top < innerHeight);
      if (avoid.length && !shown.length) return;
      target.current = headCentre(
        innerWidth,
        innerHeight,
        shown.length ? Math.min(...shown.map((box) => box.left)) : undefined,
      );
      if (still.matches)
        Object.assign(framedHead, { x: target.current, speed: 0 });
    };
    measure();
    const timer = setInterval(measure, MEASURE_MS);
    return () => clearInterval(timer);
  }, []);

  useFrame(({ camera, size }, delta) => {
    const goal = target.current ?? size.width / 2;
    Object.assign(
      framedHead,
      Number.isNaN(framedHead.x)
        ? { x: goal, speed: 0 }
        : glide(framedHead, goal, Math.min(delta, 0.1)),
    );
    const { width, height } = size;
    (camera as PerspectiveCamera).setViewOffset(
      width,
      height,
      width / 2 - framedHead.x,
      0,
      width,
      height,
    );
  });

  return null;
}
