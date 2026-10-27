// Builds public/background/fonts/kanit.json: the home page title's font (Kanit
// Regular, which the page loads; app/layout.tsx) as three.js typeface data,
// so the name can be drawn as 3D letters in the head's material
// (components/Background/TitleName.tsx). Only the letters the name uses are
// kept.
//
//   node scripts/build-title-font.mjs
//
// Kanit is licensed under the SIL Open Font License 1.1, which travels with it
// as public/background/fonts/OFL.txt. It is pinned to a commit of Google Fonts.

import fs from 'node:fs';
import path from 'node:path';

import { TTFLoader } from 'three/addons/loaders/TTFLoader.js';

const COMMIT = '674cdcf5e290b4d29f7b017ad1643e536d1bc372';
const BASE = `https://raw.githubusercontent.com/google/fonts/${COMMIT}/ofl/kanit`;
const KEEP = "ABCDEFGHIJKLMNOPQRSTUVWXYZ' ";
const OUT = path.join(import.meta.dirname, '../public/background/fonts');

const fetchFile = async (name) => {
  const response = await fetch(`${BASE}/${name}`);
  if (!response.ok) throw new Error(`${name}: ${response.status}`);
  return Buffer.from(await response.arrayBuffer());
};

const ttf = await fetchFile('Kanit-Regular.ttf');
const font = new TTFLoader().parse(
  ttf.buffer.slice(ttf.byteOffset, ttf.byteOffset + ttf.byteLength),
);
font.glyphs = Object.fromEntries(
  Object.entries(font.glyphs).filter(([glyph]) => KEEP.includes(glyph)),
);
fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(path.join(OUT, 'kanit.json'), JSON.stringify(font));
fs.writeFileSync(path.join(OUT, 'OFL.txt'), await fetchFile('OFL.txt'));
process.stdout.write(
  `public/background/fonts/kanit.json: ${Object.keys(font.glyphs).length} glyphs\n`,
);
