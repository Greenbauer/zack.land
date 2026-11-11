import fs from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import { posterOf } from './videoPoster';

const PUBLIC = path.join(__dirname, '../public');
const videos = ['miscellaneous', 'web-apps'].flatMap((dir) =>
  fs
    .readdirSync(path.join(PUBLIC, dir))
    .filter((file) => file.endsWith('.mp4'))
    .map((file) => `/${dir}/${file}`),
);

describe("a post's silent loop", () => {
  it('has its poster beside it, a JPEG', () => {
    expect(videos.length).toBeGreaterThan(0);
    for (const video of videos) {
      const poster = path.join(PUBLIC, posterOf(video));
      expect(fs.existsSync(poster), posterOf(video)).toBe(true);
      expect(fs.readFileSync(poster).subarray(0, 2)).toEqual(
        Buffer.from([0xff, 0xd8]),
      );
    }
  });
});
