// When the page's 3D scene is ready: loaded and drawing frames smoothly
// (data-scene-ready on <html>, index.tsx), which the head's first placement
// waits for (HeadFraming.tsx). Its load takes a second or more (more on a
// phone). Until then a dark screen covers the page, and the page's own motion
// as it opens (the home title, the contact card, a post's card, the header
// and footer fading in) waits under it: styles/globals.css holds it where it
// starts until data-page-in, set as the camera comes out of the head's mouth
// (intro.ts), or as the dark screen fades without that.

// How many frames in a row must each come within SMOOTH_SECONDS of the last.
export const SMOOTH_FRAMES = 3;
export const SMOOTH_SECONDS = 0.1;
// The longest the page waits for the scene under the dark screen, in
// milliseconds (no WebGL, or a very slow load).
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

export const markPageIn = () =>
  document.documentElement.setAttribute('data-page-in', '');

// Calls `then` once the page is in (data-page-in), at once if it already is.
// Returns what stops waiting.
export function whenPageIn(then: () => void): () => void {
  const html = document.documentElement;
  if (html.hasAttribute('data-page-in')) {
    then();
    return () => {};
  }
  const watch = new MutationObserver(() => {
    if (!html.hasAttribute('data-page-in')) return;
    watch.disconnect();
    then();
  });
  watch.observe(html, { attributes: true, attributeFilter: ['data-page-in'] });
  return () => watch.disconnect();
}

// When the scene has drawn its first frame, the 3D titles with it: until
// then, where WebGL is drawn in software, the page's own titles show as text
// (data-scene-drawn on <html>, styles/globals.css), as they do if the dark
// screen fades before the scene draws.
export const markSceneDrawn = () =>
  document.documentElement.setAttribute('data-scene-drawn', '');

export function markSceneReady() {
  markSceneDrawn();
  document.documentElement.setAttribute('data-scene-ready', '');
}
