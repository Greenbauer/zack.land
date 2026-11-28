import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { gunzipSync } from 'node:zlib';

import { describe, expect, it } from 'vitest';

import { decodeGlasses, GLASSES_PARTS } from './glassesGeometry';

// The shipped file, unzipped as loadGlasses does in the browser.
const unzipped = gunzipSync(readFileSync(join(__dirname, 'files/glasses.bin')));
const glasses = decodeGlasses(
  unzipped.buffer.slice(
    unzipped.byteOffset,
    unzipped.byteOffset + unzipped.byteLength,
  ) as ArrayBuffer,
);

describe('the Banner Eyewear glasses file', () => {
  it('holds the frame, the lenses, both arms and their words, each a whole mesh', () => {
    for (const part of GLASSES_PARTS) {
      const geometry = glasses[part];
      const vertices = geometry.getAttribute('position').count;
      expect(vertices).toBeGreaterThan(100);
      expect(geometry.getAttribute('normal').count).toBe(vertices);
      const index = geometry.getIndex()!;
      expect(index.count % 3).toBe(0);
      // Every triangle names a vertex the part has.
      let highest = 0;
      for (let k = 0; k < index.count; k++)
        highest = Math.max(highest, index.getX(k));
      expect(highest).toBeLessThan(vertices);
    }
  });

  it('is in millimetres, lenses forward and arms reaching back', () => {
    glasses.frame.computeBoundingBox();
    glasses.left.computeBoundingBox();
    glasses.right.computeBoundingBox();
    const frame = glasses.frame.boundingBox!;
    // About 15cm across, centred.
    expect(frame.max.x - frame.min.x).toBeGreaterThan(140);
    expect(frame.max.x - frame.min.x).toBeLessThan(170);
    expect(Math.abs(frame.max.x + frame.min.x)).toBeLessThan(2);
    // The arms run back behind the front.
    expect(glasses.left.boundingBox!.min.z).toBeLessThan(frame.min.z - 50);
    expect(glasses.right.boundingBox!.min.z).toBeLessThan(frame.min.z - 50);
  });

  it('carries a word along each arm, outside it', () => {
    for (const [arm, word, side] of [
      ['left', 'leftText', 1],
      ['right', 'rightText', -1],
    ] as const) {
      glasses[arm].computeBoundingBox();
      glasses[word].computeBoundingBox();
      const armBox = glasses[arm].boundingBox!;
      const wordBox = glasses[word].boundingBox!;
      // The left arm is at +x, the right at -x; each word lies on its own.
      expect(Math.sign(wordBox.getCenter(armBox.min.clone()).x)).toBe(side);
      // Along the arm, between the front and the ear tip.
      expect(wordBox.max.z).toBeLessThanOrEqual(armBox.max.z + 5);
      expect(wordBox.min.z).toBeGreaterThanOrEqual(armBox.min.z - 5);
      // A word is far longer than it is tall.
      expect(wordBox.max.z - wordBox.min.z).toBeGreaterThan(
        (wordBox.max.y - wordBox.min.y) * 3,
      );
    }
    // EYEWEAR has a letter more than BANNER, so more of a mesh.
    expect(glasses.leftText.getAttribute('position').count).toBeGreaterThan(
      glasses.rightText.getAttribute('position').count,
    );
  });
});
