// A page's hold on the 3D head's face (MyHead.tsx): while `worried` is on,
// the face looks worried (WORRIED) in place of its usual reactions to the
// pointer, while the head still turns and wanders as it would. The 404 page
// turns it on while it shows.
export const headMood = { worried: false };

// Worried: the head's own worried expression (scripts/head/expressions.mjs:
// inner brows drawn up and together, lips pressed, mouth corners down).
export const WORRIED: Record<string, number> = { worried: 1 };
