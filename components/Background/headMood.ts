// A page's hold on the 3D head's face (MyHead.tsx): while `worried` is on,
// the head turns to face the camera and looks worried (WORRIED), whatever
// the pointer does. The 404 page turns it on while it shows.
export const headMood = { worried: false };

// Worried, from the head's expressions: brows raised high, eyes wide, lips
// just parted and pressed forward.
export const WORRIED: Record<string, number> = {
  browsUp: 1,
  wide: 0.8,
  gasp: 0.2,
  pout: 0.3,
};
