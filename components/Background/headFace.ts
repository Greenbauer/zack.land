import { facingSmile, pointerExpressions } from './faceExpression';
import { headMood, WORRIED } from './headMood';
import { SEARCH_FACE } from './headSearch';
import { HeadTaps, tapExpressions, tapsOn } from './headTaps';
import { Greeting, greetingExpressions, greetingOn } from './idleGreeting';

type Point = { x: number; y: number };

// What the head's face is set to make (MyHead.tsx eases toward it), before
// the passing look and the blinks: a tap's reaction (headTaps.ts); worried
// on a page that holds the face so (the 404 page: headMood.ts), while the
// head still moves as it would; the greeting (no expression while the head
// turns to the camera, then the gasp, then the smile: idleGreeting.ts); the
// frown of looking for the pointer it lost (`searching`: headSearch.ts);
// otherwise its reactions to where it looks (`look`; `spot`, on screen,
// against where the `eyes` are, in a window of `size`).
export function faceTargets(
  {
    taps,
    greeting,
    searching,
  }: { taps: HeadTaps; greeting: Greeting; searching: boolean },
  look: Point,
  spot: Point,
  eyes: Point,
  size: { width: number; height: number },
): Record<string, number> {
  if (tapsOn(taps)) return tapExpressions(taps);
  if (headMood.worried) return WORRIED;
  if (greetingOn(greeting)) return greetingExpressions(greeting);
  if (searching) return SEARCH_FACE;
  return { smile: facingSmile(look), ...pointerExpressions(spot, eyes, size) };
}
