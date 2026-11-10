// The files the 3D scene loads before the dark screen lifts (Loader.tsx).
// The layout (app/(root)/layout.tsx) starts their downloads as the page's
// first script (fetchEarly), so they arrive alongside the scripts rather
// than after the scripts have run and the scene has mounted. Kept free of
// imports, so the layout, a server component, can read it.

// The head (headGeometry.ts, scripts/build-head.mjs).
export const HEAD_FILE = '/background/geometry/head.bin';
// The sky (Background/index.tsx).
export const SKY_FILE = '/background/environment/kiara_1_dawn_1k.hdr';
// The colour grade's table (Grading.tsx).
export const LUT_FILE = '/background/environment/cubicle-99.cube';
// The 3D title's font (titleLetters.tsx, scripts/build-title-font.mjs).
export const FONT_FILE = '/background/fonts/kanit.json';

export const SCENE_FILES = [HEAD_FILE, SKY_FILE, LUT_FILE, FONT_FILE];

// Runs in the page as it is read (its source is written into an inline
// script): fetches `files` at once, and hands each one's response to the
// page's first fetch() of it, which three's and drei's loaders make once the
// scene mounts. Any other fetch, and a later one of the same file, goes to
// the network as before. Not <link rel="preload">: Safari's engine never
// gives a preload to fetch(), so it downloaded every file twice.
export function fetchEarly(files: readonly string[]) {
  const absolute = (url: string) => new URL(url, location.href).href;
  const early = new Map(files.map((file) => [absolute(file), fetch(file)]));
  const original = window.fetch;
  const fetchLater: typeof fetch = (input, init) =>
    original.call(window, input, init);
  window.fetch = (input, init) => {
    const isRequest = input instanceof Request;
    const url = isRequest ? input.url : absolute(String(input));
    const method = init?.method ?? (isRequest ? input.method : 'GET');
    const response = method.toUpperCase() === 'GET' && early.get(url);
    if (!response) return fetchLater(input, init);
    early.delete(url);
    if (!early.size) window.fetch = original;
    // A download that failed is tried again, as the loader asked.
    return response.catch(() => fetchLater(input, init));
  };
}
