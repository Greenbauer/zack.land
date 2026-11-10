// The files the 3D scene loads before the dark screen lifts (Loader.tsx).
// The layout (app/(root)/layout.tsx) asks for them in the page's <head>, so
// they download alongside the scripts rather than after the scripts have
// run and the scene has mounted. Kept free of imports, so the layout, a
// server component, can read it.

// The head (headGeometry.ts, scripts/build-head.mjs).
export const HEAD_FILE = '/background/geometry/head.bin';
// The sky (Background/index.tsx).
export const SKY_FILE = '/background/environment/kiara_1_dawn_1k.hdr';
// The colour grade's table (Grading.tsx).
export const LUT_FILE = '/background/environment/cubicle-99.cube';
// The 3D title's font (titleLetters.tsx, scripts/build-title-font.mjs).
export const FONT_FILE = '/background/fonts/kanit.json';

export const SCENE_FILES = [HEAD_FILE, SKY_FILE, LUT_FILE, FONT_FILE];
