import type { StoryCue } from './storyCue';

// A page's hold on the 3D head's face (MyHead.tsx): while `worried` is on,
// the face looks worried (WORRIED) in place of its usual reactions to the
// pointer, while the head still turns and wanders as it would. The 404 page
// turns it on while it shows.
// `cue`: the home page's story, the chapter in view asking for a face and
// where to look (storyCue.ts); null on every other page.
export const headMood: { worried: boolean; cue: StoryCue | null } = {
  worried: false,
  cue: null,
};

// Worried: the head's own worried expression (scripts/head/expressions.mjs:
// inner brows drawn up and together, lips pressed, mouth corners down).
export const WORRIED: Record<string, number> = { worried: 1 };
