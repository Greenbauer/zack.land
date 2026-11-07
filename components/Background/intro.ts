import { GLIDE_SECONDS } from './headPlace';
import {
  BODY_SHARE,
  CHEST_PIVOT,
  NECK_BASE_POINT,
  SKULL_PIVOT,
} from './headTurn';
import { markPageIn } from './sceneReady';

// The page's first load: a dark screen with a spinner (data-loader,
// index.tsx) until the 3D scene is ready, the camera waiting inside the
// head's open mouth, which is as dark. Then the spinner fades, the dark
// screen with it, and the camera pulls back out of the mouth (HeadFraming.tsx)
// to show the face surprised, mouth wide and brows up; it then closes its
// mouth, smiles at the camera as it comes to rest, and turns to the pointer
// (MyHead.tsx), to where the page rests. The page's own motion as it opens (sceneReady.ts
// data-page-in) starts part way out. With reduced motion, or WebGL drawn in
// software (a few frames a second), the dark screen only fades. It plays
// once, as the scene loads only once.

export type Intro =
  { phase: 'loading' } | { phase: 'flying'; since: number } | { phase: 'done' };

// Where the page's load is, read each frame (MyHead.tsx, HeadFraming.tsx),
// and whether the page has a card that covers the head where it rests (the
// contact form, a post's card on a phone: HeadFraming.tsx measures it).
export const intro: { state: Intro; covered: boolean } = {
  state: { phase: 'loading' },
  covered: false,
};

// How long the camera takes to come out of the mouth to its place, in
// seconds, and how much slower than evenly eased it starts (a power on the
// share of the time): it creeps out through the lips, then picks up.
export const INTRO_SECONDS = 3.4;
const SLOW_START = 1.3;
// When the face lets go of its surprise, the mouth closing, in seconds into
// the intro: well after the camera has passed the lips (about 1.1 s in),
// once the whole face is in view, shut just before the camera rests.
export const MOUTH_SHUT = [2.3, 3] as const;
// When it smiles at the camera, in seconds into the intro: the smile comes in
// as the mouth closes, whole as the camera rests, and is held a second before
// the head lets go (RELEASE_SECONDS). The head faces the camera until then.
export const SMILE_IN = [2.7, 3.4] as const;
export const RELEASE_SECONDS = 4.4;
// The surprised face the head waits with (head.bin expressions, all in
// SHOWN_EXPRESSIONS): the gasp's dropped jaw, the brows raised high, the
// forehead with them.
export const SURPRISED = {
  gasp: 1,
  browsUp: 1,
  browInnerUp: 0.5,
  browOuterUp: 0.5,
} as const;
// When the page's own motion starts, in seconds into the intro (where a card
// covers the head, once it has smiled and glided off, coveredPageIn): once the
// camera is behind the 3D titles' plane (titleLetters.tsx PLANE_Z, z 110,
// passed about 2.3 s in), its 1.4 s slides then resting as the camera does.
export const PAGE_IN_SECONDS = 2.35;
// Where a card covers the head: once it has let go (RELEASE_SECONDS) and
// glided off (headPlace.ts GLIDE_SECONDS). The page's own load as it moves in
// (a post's images) can stall a frame or two, which would jump the glide.
export const COVERED_PAGE_IN = RELEASE_SECONDS + GLIDE_SECONDS;

// How far the head is tipped up while the camera comes out, in radians (the
// head's nod, headTurn.ts; up is negative): the gasp drops the jaw, so the
// open mouth faces about 30 degrees down, and tipped this far it faces the
// camera flat. Looking into it that way, the camera sees past the mouth's
// own dark inside (one sheet, the shape of the open jaw) into the hollow
// head, which MyHead.tsx lines in black while the mouth is open, as the sky
// would show through it. It levels out over TIP_BACK, in seconds into the
// intro, as the camera comes to rest.
export const INTRO_TIP = -0.5;
export const TIP_BACK = [2.7, 3.4] as const;

// Where the camera rests, in the scene's units (index.tsx).
export const CAMERA_HOME = [0, 0, 250] as const;
// Where it waits, in head.bin units: in the middle of the open mouth (the
// gasp, the jaw dropped: upper lip at y -36, lower at -52), just behind the
// lips, looking in.
export const IN_MOUTH = [0, -44, 36] as const;
// How far in front of the camera the back of the mouth is there, in the
// scene's units: the pull back is even in how far the camera is from it, so
// it feels as fast near the lips as further out.
const MOUTH_DEPTH = 14;

type Point3 = readonly [number, number, number];

// `p` turned by `angle` (radians) about the vertical through `pivot`, as
// three.js and the head's shader turn about y.
const turnAbout = (p: Point3, angle: number, pivot: Point3): Point3 => {
  const [x, z] = [p[0] - pivot[0], p[2] - pivot[2]];
  const [c, s] = [Math.cos(angle), Math.sin(angle)];
  return [pivot[0] + c * x + s * z, p[1], pivot[2] - s * x + c * z];
};

// `p` tipped by `angle` (radians, positive nodding down) about the
// horizontal through `pivot`, as the shader tips about x.
const tipAbout = (p: Point3, angle: number, pivot: Point3): Point3 => {
  const [y, z] = [p[1] - pivot[1], p[2] - pivot[2]];
  const [c, s] = [Math.cos(angle), Math.sin(angle)];
  return [p[0], pivot[1] + c * y - s * z, pivot[2] + s * y + c * z];
};

// `p` (on the head, which the neck carries whole) with the neck bent by
// `angle` about x, evenly from its base to the skull: the shader's bendNeck
// for a head weight of 1, the head riding on the end of the bent neck's arc.
const bendNeck = (p: Point3, angle: number): Point3 => {
  const base = NECK_BASE_POINT;
  const span = [0, 1, 2].map((k) => SKULL_PIVOT[k]! - base[k]!);
  const length = Math.hypot(...span);
  const axis = span.map((v) => v / length);
  const side = [0, -axis[2]!, axis[1]!];
  const along =
    Math.abs(angle) < 1e-4 ? length : (Math.sin(angle) * length) / angle;
  const aside =
    Math.abs(angle) < 1e-4
      ? 0.5 * length * angle
      : ((1 - Math.cos(angle)) * length) / angle;
  const tipped = tipAbout(p, angle, SKULL_PIVOT);
  return [0, 1, 2].map(
    (k) =>
      tipped[k]! -
      SKULL_PIVOT[k]! +
      base[k]! +
      axis[k]! * along +
      side[k]! * aside,
  ) as unknown as Point3;
};

// `point` on the head (head.bin units) in the scene, while the head faces
// the camera tipped up `tip` (radians, at most 0: up, where the skull's own
// tuck takes none of it): the body turned `bodyTurn` and raised `lift`
// (MyHead.tsx), the head turned back as far on its neck, as the shader turns
// and tips it (headTurn.ts: the neck's share of the turn about the skull and
// of the tip along the neck, the body's of each about the chest).
export function onFacingHead(
  point: Point3,
  bodyTurn: number,
  lift: number,
  tip = 0,
): Point3 {
  const neck = turnAbout(point, -bodyTurn * (1 - BODY_SHARE.turn), SKULL_PIVOT);
  const bent = bendNeck(neck, tip * (1 - BODY_SHARE.nod));
  const nodded = tipAbout(bent, tip * BODY_SHARE.nod, CHEST_PIVOT);
  const chest = turnAbout(nodded, -bodyTurn * BODY_SHARE.turn, CHEST_PIVOT);
  const [x, y, z] = turnAbout(chest, bodyTurn, [0, 0, 0]);
  return [x, y + lift, z];
}

// How far the head is tipped up at `time` (INTRO_TIP, levelling out over
// TIP_BACK).
export const introTip = (state: Intro, time: number) =>
  INTRO_TIP * (1 - smoothstep(...TIP_BACK, introTime(state, time)));

const easeInOut = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
const smoothstep = (from: number, to: number, t: number) => {
  const k = Math.min(1, Math.max(0, (t - from) / (to - from)));
  return k * k * (3 - 2 * k);
};

// How far into the intro it is at `time` (seconds on the scene's clock): 0
// while loading, and past its end once done.
const introTime = (state: Intro, time: number) =>
  state.phase === 'loading'
    ? 0
    : state.phase === 'done'
      ? Infinity
      : time - state.since;

// The share of the way the camera is from the mouth to its place `seconds`
// into the intro, over a path `length` long: eased in and out, starting
// slower still (SLOW_START), and even in the log of its distance from the
// back of the mouth.
export function pulledOut(seconds: number, length: number): number {
  const eased = easeInOut(
    Math.min(1, Math.max(0, seconds / INTRO_SECONDS)) ** SLOW_START,
  );
  const far = (MOUTH_DEPTH + length) / MOUTH_DEPTH;
  return (far ** eased - 1) / (far - 1);
}

// Where the camera is at `time`, and the share of the way it has come, which
// the head's place on the page (HeadFraming.tsx) is given as it comes. It
// comes from the mouth as it is then (`mouthAt` the head's tip,
// onFacingHead), so it follows the mouth as the head tips up and back.
export function introCamera(
  state: Intro,
  time: number,
  mouthAt: (_tip: number) => Point3,
) {
  const start = mouthAt(introTip(state, time));
  const length = Math.hypot(...CAMERA_HOME.map((v, k) => v - start[k]!));
  const share = pulledOut(introTime(state, time), length);
  return {
    position: CAMERA_HOME.map((v, k) => start[k]! + share * (v - start[k]!)),
    share,
  };
}

// The face at `time`: SURPRISED while loading, easing out once the camera
// is out (MOUTH_SHUT) into a smile (SMILE_IN).
export function introFace(state: Intro, time: number): Record<string, number> {
  const seconds = introTime(state, time);
  const surprised = 1 - smoothstep(...MOUTH_SHUT, seconds);
  return {
    ...Object.fromEntries(
      Object.entries(SURPRISED).map(([name, strength]) => [
        name,
        strength * surprised,
      ]),
    ),
    smile: smoothstep(...SMILE_IN, seconds),
  };
}

// Whether the head is held facing the camera, its face the intro's, at
// `time`: while loading, and until it has smiled (RELEASE_SECONDS).
export const introHolds = (state: Intro, time: number) =>
  state.phase === 'loading' ||
  (state.phase === 'flying' && time - state.since < RELEASE_SECONDS);

// What the page shows beside the head, as HeadFraming.tsx measures it: its
// left edge where it rests, whether it is a card (data-head-avoid="card") or
// sits above the head ("above"), and whether it is the card of a post out of
// view (data-off-view, EdgeCard.tsx), which stays hidden as the page moves in.
export type Beside = {
  left: number;
  card: boolean;
  above: boolean;
  offView: boolean;
};

// Where the head goes on the page's first load, from what will show beside
// it once the page moves in (`boxes`, shown yet or not), by `centre`
// (headCentre for the window, covered or not, and the left edge of what is
// beside it): `open`, its place with no card over it, which it comes out to
// and smiles in; `resting`, where it then stays; and whether a card will
// cover it there (`covered`), so it glides off once it has smiled. Where
// none will, the two are the same, and it stays where it comes out to.
export function introPlaces(
  boxes: readonly Beside[],
  centre: (_covered: boolean, _freeRight: number | undefined) => number,
) {
  const beside = boxes.filter((box) => !box.above && !box.offView);
  const freeRight = beside.length
    ? Math.min(...beside.map((box) => box.left))
    : undefined;
  const open = centre(false, freeRight);
  const resting = centre(
    beside.some((box) => box.card),
    freeRight,
  );
  return { open, resting, covered: resting !== open };
}

// The dark screen fades (data-intro on <html>): "fly" as the camera comes
// out, when it waits a little longer (Loader.tsx), still over the dark
// inside of the mouth for the first second, then fades as the face comes
// into view.
const markIntro = (flies = false) =>
  document.documentElement.setAttribute('data-intro', flies ? 'fly' : '');

// The scene is ready at `time`: the camera comes out of the mouth if it
// `flies`, else the dark screen just fades and the page moves in.
export function startIntro(time: number, flies: boolean) {
  if (intro.state.phase !== 'loading') return;
  markIntro(flies);
  if (flies) intro.state = { phase: 'flying', since: time };
  else endIntro();
}

// Each frame at `time`: the page moves in part way out (or once the head has
// glided off, where a card covers it), and the intro ends once the head has
// let go and the page moved in (the camera rested at INTRO_SECONDS).
export function stepIntro(time: number) {
  const { state } = intro;
  if (state.phase !== 'flying') return;
  const pageIn = intro.covered ? COVERED_PAGE_IN : PAGE_IN_SECONDS;
  const seconds = time - state.since;
  if (seconds >= pageIn) markPageIn();
  if (seconds >= Math.max(pageIn, RELEASE_SECONDS))
    intro.state = { phase: 'done' };
}

// No intro (the scene never drew in time, or no motion): the dark screen
// fades and the page moves in at once.
export function endIntro() {
  if (intro.state.phase === 'flying') return;
  markIntro();
  markPageIn();
  intro.state = { phase: 'done' };
}
