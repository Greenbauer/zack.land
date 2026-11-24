import type { Point } from './headLook';

// What the home page's story (components/Home/chapters.ts) asks of the head
// for the chapter in view: a few beats, each from `at` seconds into the
// chapter, each a face to make and, for a moment, where to look. The page
// sets it on headMood.cue as the chapter arrives and clears it as it goes;
// the head (MyHead.tsx, headFace.ts) reads it every frame.

// Where a beat has the head look: at the chapter's card, at the camera (the
// person reading), or up, as if thinking. With none it follows the pointer
// or looks around as usual.
export type Gaze = 'card' | 'camera' | 'up';

export type Beat = {
  at: number;
  face: Record<string, number>;
  look?: Gaze;
};

// Something a chapter brings into the scene while it shows, around the head
// (StoryProps.tsx): sunglasses on its face, a sleep mask over its eyes
// (`sleepmask`, sleepMask.ts), its own wireframe, a
// graduation cap with tortillas thrown past (`tortillas`), or a phone that
// takes its place and calls you, the head on its screen (PhoneCall.tsx).
export type StoryProp =
  'sunglasses' | 'sleepmask' | 'wireframe' | 'tortillas' | 'phone';

// `since`: when the chapter's beats start (seconds, performance.now() /
// 1000); its prop comes in at once. `card`: the look target (headLook.ts
// units) that points at its card. `prop`: what it brings into the scene, if
// anything.
export type StoryCue = {
  beats: Beat[];
  since: number;
  card: Point;
  prop?: StoryProp;
};

// Look targets for the other gazes: straight at the camera, and up and a
// little to the side.
const CAMERA: Point = { x: 0, y: 0 };
const UP: Point = { x: 120, y: -220 };

// The beat under way at `now`: the last whose time has come. None before the
// first.
export function cueBeat(cue: StoryCue, now: number): Beat | null {
  const into = now - cue.since;
  let beat: Beat | null = null;
  for (const each of cue.beats) if (each.at <= into) beat = each;
  return beat;
}

// The face the story asks for at `now` (none before its first beat). The
// head eases toward it as it does any expression.
export const cueFace = (cue: StoryCue, now: number): Record<string, number> =>
  cueBeat(cue, now)?.face ?? {};

// Where the story has the head look at `now`, as a look target, or null to
// leave the head to the pointer and its own looking around.
export function cueLook(cue: StoryCue, now: number): Point | null {
  const look = cueBeat(cue, now)?.look;
  if (look === 'card') return cue.card;
  if (look === 'camera') return CAMERA;
  if (look === 'up') return UP;
  return null;
}
