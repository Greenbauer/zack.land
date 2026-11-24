import type { PerspectiveCamera } from 'three';

import { framedHead } from './headPlace';

// How far something standing where the head does has to slide to its left to
// be off the window, in the scene's units, if it reaches `reach` units either
// side of its middle: the last chapter's phone and the head it swaps with
// (PhoneCall.tsx, MyHead.tsx), which go off that side as the head does
// wherever a card takes its place (headPlace.ts).
export function slideOff(
  camera: PerspectiveCamera,
  height: number,
  reach: number,
): number {
  const perPixel =
    (2 * Math.tan((camera.fov * Math.PI) / 360) * camera.position.length()) /
    height;
  return Math.max(0, framedHead.x) * perPixel + reach;
}
