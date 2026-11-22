import type { StoryCue, StoryProp } from './storyCue';

// When each prop comes in, seconds after its chapter's beats start
// (storyCue.ts since): the sunglasses as the head smiles at the camera
// (components/Home/chapters.ts), the wireframe as it gasps, the rest at once.
export const PROP_DELAY: Record<StoryProp, number> = {
  sunglasses: 1.6,
  wireframe: 2.3,
  plane: 0.6,
  tortillas: 0.5,
};

// How much of `prop` the story asks for at `now`: 1 from its delay on while
// its chapter shows, else 0.
export function propTarget(
  cue: StoryCue | null,
  prop: StoryProp,
  now: number,
): number {
  if (!cue || cue.prop !== prop) return 0;
  return now - cue.since >= PROP_DELAY[prop] ? 1 : 0;
}
