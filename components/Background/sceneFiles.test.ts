import fs from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import { SCENE_FILES } from './sceneFiles';

const root = path.join(__dirname, '../..');
// Every address under /background/ that the scene's own code names.
const named = fs
  .readdirSync(__dirname)
  .filter((file) => /\.tsx?$/.test(file) && !/\.test\.tsx?$/.test(file))
  .flatMap((file) => [
    ...fs
      .readFileSync(path.join(__dirname, file), 'utf8')
      .matchAll(/['"](\/background\/[^'"]+)['"]/g),
  ])
  .map((match) => match[1]!);

describe('the scene files the layout preloads', () => {
  it('are every file the scene names, so none is found late', () => {
    // The sky's, named in JSX (double quotes), is one of them.
    expect(named.some((file) => file.endsWith('.hdr'))).toBe(true);
    for (const file of named) expect(SCENE_FILES).toContain(file);
  });

  it('are all served from public/', () => {
    for (const file of SCENE_FILES)
      expect(fs.existsSync(path.join(root, 'public', file)), file).toBe(true);
  });

  it('are asked for in the layout, in the way three fetches them', () => {
    const layout = fs.readFileSync(
      path.join(root, 'app/(root)/layout.tsx'),
      'utf8',
    );
    expect(layout).toMatch(
      /for \(const file of SCENE_FILES\)\s+preload\(file, \{ as: 'fetch', crossOrigin: 'anonymous' \}\)/,
    );
  });
});
