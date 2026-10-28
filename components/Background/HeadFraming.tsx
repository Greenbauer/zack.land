'use client';

import { useFrame } from '@react-three/fiber';
import { useEffect, useRef } from 'react';
import { PerspectiveCamera } from 'three';

import { framedHead, glide, headCentre } from './headPlace';

// How often the page is measured for the head's place, in milliseconds.
const MEASURE_MS = 300;

// Moves the camera so the head's middle sits where headCentre says, gliding
// there (glide, a damped spring) when the page or the window changes, and on
// a phone off the screen and back as a card (data-head-avoid="card") comes
// and goes. The page is measured a few times
// a second, not every frame: the left edge of whatever marked data-head-avoid
// is showing, where it rests. While none shows (a post's card between fades),
// the head stays where it is. Renders nothing.
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
        .map((el) => {
          // Where it rests: less any slide it is part way through (a card
          // arriving slides in from the left, CSS translate).
          const box = el.getBoundingClientRect();
          const slide = parseFloat(getComputedStyle(el).translate) || 0;
          return {
            top: box.top,
            bottom: box.bottom,
            left: box.left - slide,
            card: el.dataset.headAvoid === 'card',
            above: el.dataset.headAvoid === 'above',
          };
        })
        .filter((box) => box.bottom > 0 && box.top < innerHeight);
      if (avoid.length && !shown.length) return;
      // A card above the head (data-head-avoid="above", EdgeCard) leaves it
      // centred under it.
      const beside = shown.filter((box) => !box.above);
      target.current = headCentre(
        innerWidth,
        innerHeight,
        beside.length ? Math.min(...beside.map((box) => box.left)) : undefined,
        beside.some((box) => box.card),
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
