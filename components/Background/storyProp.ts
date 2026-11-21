import type { StoryCue, StoryProp } from './storyCue';

// When each prop comes in, seconds after its chapter's beats start
// (storyCue.ts since): the sunglasses as the head smiles at the camera
// (components/Home/chapters.ts), the wireframe as it gasps, the rest at once.
export const PROP_DELAY: Record<StoryProp, number> = {
  sunglasses: 1.6,
  wireframe: 2.3,
  agents: 0.4,
  plane: 0.6,
  bang: 3,
};

// How long the bang's flash lasts (seconds).
export const BANG_SECONDS = 0.6;

// How much of `prop` the story asks for at `now`: 1 from its delay on while
// its chapter shows, else 0; the bang only for its moment.
export function propTarget(
  cue: StoryCue | null,
  prop: StoryProp,
  now: number,
): number {
  if (!cue || cue.prop !== prop) return 0;
  const into = now - cue.since - PROP_DELAY[prop];
  if (into < 0) return 0;
  if (prop === 'bang') return into < BANG_SECONDS ? 1 - into / BANG_SECONDS : 0;
  return 1;
}
