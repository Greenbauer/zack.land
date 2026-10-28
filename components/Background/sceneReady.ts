// When the page's 3D scene is ready: loaded and drawing frames smoothly. Its
// load stalls the page for a second or more (more on a phone), and motion a
// page starts as it loads would be spent behind those stalls, so until then
// styles/globals.css holds it where it starts and keeps the header and
// footer hidden. Marked by data-scene-ready on <html> (index.tsx).

// How many frames in a row must each come within SMOOTH_SECONDS of the last.
export const SMOOTH_FRAMES = 3;
export const SMOOTH_SECONDS = 0.1;
// The longest the page waits for the scene, in milliseconds (no WebGL, or a
// very slow load).
export const READY_AT_MOST_MS = 6000;

// Takes each frame's time since the last, in seconds; true once
// `frames` quick ones have come in a row.
export function frameSettler(frames = SMOOTH_FRAMES, quick = SMOOTH_SECONDS) {
  let run = 0;
  return (delta: number) => {
    run = delta <= quick ? run + 1 : 0;
    return run >= frames;
  };
}

export const markSceneReady = () =>
  document.documentElement.setAttribute('data-scene-ready', '');
