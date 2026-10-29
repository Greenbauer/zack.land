'use client';

import { useEffect, useState } from 'react';

// The pointer's latest position, in CSS pixels, and whether anyone has done
// anything on the page (moved the pointer, or any other interaction:
// ACTIVITY) since its reader last cleared `moved`. The head only counts as
// left alone, and greets with its surprised look, while it stays clear.
export type MousePosition = {
  x: number;
  y: number;
  moved: boolean;
};

// Interactions other than moving the pointer that mean someone is there:
// scrolling (by wheel, trackpad, keys or a dragged scrollbar: the page
// scrolls in its own box, so scroll is listened for in the capture phase),
// pressing, tapping and typing.
export const ACTIVITY = [
  'scroll',
  'wheel',
  'keydown',
  'pointerdown',
  'touchstart',
  'input',
] as const;

// Keeps `position` up to date from events on `target` (the document);
// returns a function that stops it.
export function watchPointer(target: EventTarget, position: MousePosition) {
  const onMove = (event: Event) => {
    const { clientX, clientY } = event as MouseEvent;
    Object.assign(position, { x: clientX, y: clientY, moved: true });
  };
  const onActivity = () => {
    position.moved = true;
  };
  const options = { capture: true, passive: true };
  target.addEventListener('mousemove', onMove);
  for (const type of ACTIVITY)
    target.addEventListener(type, onActivity, options);
  return () => {
    target.removeEventListener('mousemove', onMove);
    for (const type of ACTIVITY)
      target.removeEventListener(type, onActivity, options);
  };
}

// One object, updated in place as the pointer moves: moving it re-renders
// nothing, so the 3D scene that reads it every frame is not rebuilt on every
// mousemove. It starts as moved, as on a fresh page.
export default function useMousePosition() {
  const [mousePosition] = useState<MousePosition>(() => ({
    x: 0,
    y: 0,
    moved: true,
  }));

  useEffect(() => watchPointer(document, mousePosition), [mousePosition]);

  return mousePosition;
}
