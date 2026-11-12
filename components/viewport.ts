import { WIDE_FROM } from './PageScroller/edgeFade';

// The visitor's motion setting as a media query (kept live for React by
// hooks/useReducedMotion.ts).
export const REDUCED_MOTION = '(prefers-reduced-motion: reduce)';

// Whether the visitor asks for reduced motion, now.
export const isStill = () => matchMedia(REDUCED_MOTION).matches;

// Whether the window is a wide screen's (WIDE_FROM, Tailwind's md), now.
export const isWide = () => innerWidth >= WIDE_FROM;

// Whether `element` is shown (not under display: none): checkVisibility
// where the browser has it, which older Safari does not, else whether it has
// a box at all.
export const isShowing = (element: Element) =>
  element.checkVisibility
    ? element.checkVisibility()
    : element.getClientRects().length > 0;

// Calls `measure` now, then again whenever one of `elements` changes size
// and, with `andWindow`, whenever the window resizes. The function returned
// stops it.
export function watchSize(
  elements: readonly Element[],
  measure: () => void,
  andWindow = false,
) {
  measure();
  const resize = new ResizeObserver(() => measure());
  for (const element of elements) resize.observe(element);
  if (andWindow) addEventListener('resize', measure);
  return () => {
    resize.disconnect();
    if (andWindow) removeEventListener('resize', measure);
  };
}
