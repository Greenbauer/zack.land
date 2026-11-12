// Writes the scene's files as the page loads them, into
// components/Background/files/ (imported there, so the build serves each
// under a hashed name with a year's cache), from their sources:
//
// - head.bin: scripts/head/head.bin (scripts/build-head.mjs) with only the
//   expressions the page shows (components/Background/shownExpressions.ts).
//   The others stay in the source file, which the tests read.
// - cubicle-99.lut: the colour grade's table, scripts/environment/
//   cubicle-99.cube, as the bytes three-stdlib's LUTCubeLoader makes of it
//   (32 x 32 x 32 RGBA), so the page needn't read 885 KB of text.
//
//   node scripts/build-page-files.mjs
//
// It imports TypeScript (shownExpressions.ts, pageFiles.ts) through Node's own
// type stripping, so it needs Node 22.18 or later.
//
// pageFiles.test.ts fails when a file here is out of date with its source.

import fs from 'node:fs';
import path from 'node:path';

import { SHOWN_EXPRESSIONS } from '../components/Background/shownExpressions.ts';
import { pageFiles } from './pageFiles.ts';

const OUT = path.join(import.meta.dirname, '../components/Background/files');
for (const [file, bytes] of Object.entries(pageFiles(SHOWN_EXPRESSIONS))) {
  fs.writeFileSync(path.join(OUT, file), bytes);
  process.stdout.write(`${file}: ${bytes.length} bytes\n`);
}
