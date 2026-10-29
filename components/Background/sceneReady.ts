// When the page's 3D scene is ready: loaded and drawing frames smoothly
// (data-scene-ready on <html>, index.tsx), which the head's first placement
// waits for (HeadFraming.tsx). Its load takes a second or more (more on a
// phone). The page's own motion as it opens (the home title, the contact
// card, a post's card, the header and footer fading in) waits for it only
// briefly: styles/globals.css holds it where it starts until data-page-in,
// set once the scene is ready or PAGE_IN_AT_MOST_MS after the page began to
// load, whichever is first, so it rests within 2 seconds of the page opening.
// That motion is CSS translate and opacity, which the browser runs off the
// main thread, so the scene's load does not make it stutter.

// How many frames in a row must each come within SMOOTH_SECONDS of the last.
export const SMOOTH_FRAMES = 3;
export const SMOOTH_SECONDS = 0.1;
// The longest the page waits for the scene, in milliseconds (no WebGL, or a
// very slow load).
export const READY_AT_MOST_MS = 6000;
// The longest the page's own motion waits for the scene, in milliseconds
// from the start of the page's load (a slide of 1.4 s then rests by 1.9 s).
export const PAGE_IN_AT_MOST_MS = 500;

// How long from `now` (milliseconds since the page began to load) until the
// page's own motion starts at the latest: none once that time has passed, as
// on every page after the first.
export const pageInDelay = (now: number) =>
  Math.max(0, PAGE_IN_AT_MOST_MS - now);

// How long a page's own motion as it opens takes (its 1.4 s slides), in
// milliseconds.
export const PAGE_MOTION_MS = 1500;

// How long from `now` until the scene starts loading. A browser drawing
// WebGL in software (quality.ts) freezes the page for a second or two while
// the scene sets up, so there it starts once the page's own motion is done,
// which then plays without stalling; elsewhere at once.
export const sceneDelay = (now: number, software: boolean) =>
  software ? pageInDelay(now) + PAGE_MOTION_MS : 0;

// Takes each frame's time since the last, in seconds; true once
// `frames` quick ones have come in a row.
export function frameSettler(frames = SMOOTH_FRAMES, quick = SMOOTH_SECONDS) {
  let run = 0;
  return (delta: number) => {
    run = delta <= quick ? run + 1 : 0;
    return run >= frames;
  };
}

export const markPageIn = () =>
  document.documentElement.setAttribute('data-page-in', '');

// When the scene has drawn its first frame, the 3D titles with it: until
// then, where WebGL is drawn in software, the page's own titles show as text
// (data-scene-drawn on <html>, styles/globals.css).
export const markSceneDrawn = () =>
  document.documentElement.setAttribute('data-scene-drawn', '');

export function markSceneReady() {
  markPageIn();
  markSceneDrawn();
  document.documentElement.setAttribute('data-scene-ready', '');
}
