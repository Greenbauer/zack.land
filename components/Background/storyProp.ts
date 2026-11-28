import type { StoryCue, StoryProp } from './storyCue';

// How much of `prop` the story asks for: all of it from the moment the page
// turns to its chapter (Story.tsx sets the cue as the turn begins), along
// with everything else the turn moves, and none from the moment it turns
// away; but a wireframe stays as it is (its amount in `now`) until the head
// has slid off for the phone.
export function propTarget(
  cue: StoryCue | null,
  prop: StoryProp,
  now?: Record<StoryProp, number>,
): number {
  if (now && prop === 'wireframe' && cue?.prop === 'phone' && now.phone < 0.5)
    return now.wireframe;
  return cue?.prop === prop ? 1 : 0;
}

// How long the phone takes to swap with the head, all told, in seconds.
export const PHONE_SECONDS = 1.4;

// The phone's swap with the head, for how far through it is (0 to 1): each
// one's slide off the window's left side, 0 in its place and 1 wholly off.
// The head slides out over the first half, then the phone in over the
// second, gathering speed as it goes and slowing into place as it comes, as
// the page's cards do, so the two never show at once and the window is never
// long empty; going back runs the same in reverse.
export function phoneSwap(through: number): { head: number; phone: number } {
  const half = (from: number) => Math.min(1, Math.max(0, (through - from) * 2));
  return { head: half(0) ** 2, phone: (1 - half(0.5)) ** 2 };
}
