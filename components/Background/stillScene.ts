// Whether the visitor asks for reduced motion, read live (the setting can
// change while the page is open). Then the head holds still, facing the
// camera, and only blinks (MyHead.tsx), and the sky holds each view's resting
// place, jumping from one to the next as the page changes (Sky.tsx).
const query =
  typeof window === 'undefined'
    ? null
    : matchMedia('(prefers-reduced-motion: reduce)');

export const isStill = () => query?.matches ?? false;
