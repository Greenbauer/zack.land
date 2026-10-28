'use client';

import { useEffect, useState } from 'react';

// The pointer's latest position, in CSS pixels, and whether it has moved
// since its reader last cleared `moved`.
export type MousePosition = {
  x: number;
  y: number;
  moved: boolean;
};

// One object, updated in place as the pointer moves: moving it re-renders
// nothing, so the 3D scene that reads it every frame is not rebuilt on every
// mousemove. It starts as moved, as on a fresh page.
export default function useMousePosition() {
  const [mousePosition] = useState<MousePosition>(() => ({
    x: 0,
    y: 0,
    moved: true,
  }));

  useEffect(() => {
    const handleMouseMoveEvent = (e: MouseEvent) => {
      Object.assign(mousePosition, {
        x: e.clientX,
        y: e.clientY,
        moved: true,
      });
    };

    document.addEventListener('mousemove', handleMouseMoveEvent, false);
    return () =>
      document.removeEventListener('mousemove', handleMouseMoveEvent);
  }, [mousePosition]);

  return mousePosition;
}
