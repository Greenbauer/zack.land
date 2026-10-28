// A page's hold on the 3D head's face (MyHead.tsx): while `worried` is on,
// the face looks worried (WORRIED) in place of its usual reactions to the
// pointer, while the head still turns and wanders as it would. The 404 page
// turns it on while it shows.
export const headMood = { worried: false };

// Worried, from the head's expressions: brows lifted, lips pressed forward,
// eyes left as they are.
export const WORRIED: Record<string, number> = {
  browsUp: 0.7,
  pout: 0.4,
};
