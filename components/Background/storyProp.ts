import type { StoryCue, StoryProp } from './storyCue';

// When each prop comes in, seconds after its chapter's beats start
// (storyCue.ts since): the sunglasses as the head smiles at the camera
// (components/Home/chapters.ts), the wireframe as it gasps, the phone once
// the head has winked, the rest at once.
export const PROP_DELAY: Record<StoryProp, number> = {
  sunglasses: 1.6,
  wireframe: 2.3,
  plane: 0.6,
  tortillas: 0.5,
  phone: 1.4,
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

// The phone's swap with the head, for how far in the phone is (0 to 1): the
// head shrinks away over the first half, then the phone grows in over the
// second, each easing in and out, so the two never show at once. Each is a
// scale, 1 its full size; going out runs the same in reverse.
export function phoneSwap(amount: number): { head: number; phone: number } {
  const ease = (from: number) => {
    const t = Math.min(1, Math.max(0, (amount - from) * 2));
    return t * t * (3 - 2 * t);
  };
  return { head: 1 - ease(0), phone: ease(0.5) };
}
