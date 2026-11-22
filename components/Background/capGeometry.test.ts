import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { gunzipSync } from 'node:zlib';

import { Box3 } from 'three';
import { describe, expect, it } from 'vitest';

import { CAP_PARTS, decodeCap } from './capGeometry';
import { meshes } from './headFixture';

// The shipped file, unzipped as loadCap does in the browser.
const unzipped = gunzipSync(readFileSync(join(__dirname, 'files/cap.bin')));
const cap = decodeCap(
  unzipped.buffer.slice(
    unzipped.byteOffset,
    unzipped.byteOffset + unzipped.byteLength,
  ) as ArrayBuffer,
);
const box = (part: (typeof CAP_PARTS)[number]) => {
  cap[part].computeBoundingBox();
  return cap[part].boundingBox as Box3;
};

describe('the graduation cap file', () => {
  it('holds the crown, the board, the tassel and the gold, each a whole mesh', () => {
    for (const part of CAP_PARTS) {
      const geometry = cap[part];
      const vertices = geometry.getAttribute('position').count;
      expect(vertices, part).toBeGreaterThan(100);
      expect(geometry.getAttribute('normal').count).toBe(vertices);
      expect(geometry.getAttribute('color').count).toBe(vertices);
      const index = geometry.getIndex()!;
      expect(index.count % 3).toBe(0);
      let highest = 0;
      for (let k = 0; k < index.count; k++)
        highest = Math.max(highest, index.getX(k));
      expect(highest).toBeLessThan(vertices);
    }
  });

  it('sits on this head: the crown on its skull, down to the forehead', () => {
    // The head it was modelled on: its top, and its eyes' height.
    const skin = meshes.get('skin')!.positions;
    let top = -Infinity;
    for (let k = 1; k < skin.length; k += 3) top = Math.max(top, skin[k]!);
    const eye = meshes.get('leftEye')!.positions;
    let eyes = 0;
    for (let k = 1; k < eye.length; k += 3) eyes += eye[k]! / (eye.length / 3);
    const crown = box('crown');
    // Just over the top of the skull, and its point well above the eyes
    // but below the top.
    expect(crown.max.y).toBeGreaterThan(top);
    expect(crown.max.y).toBeLessThan(top + 6);
    expect(crown.min.y).toBeGreaterThan(eyes);
    expect(crown.min.y).toBeLessThan(top - 20);
  });

  it('rests the board on the crown, wider than it, the tassel hanging off its front', () => {
    const [crown, board, tassel, gold] = CAP_PARTS.map(box);
    expect(board!.min.y).toBeLessThan(crown!.max.y + 2);
    expect(board!.max.y).toBeGreaterThan(crown!.max.y);
    expect(board!.max.x - board!.min.x).toBeGreaterThan(
      crown!.max.x - crown!.min.x,
    );
    // The tassel hangs from the board down past its underside, well toward
    // the face (+z) of the crown's middle, bound by the gold band part way
    // down.
    expect(tassel!.min.y).toBeLessThan(board!.min.y - 20);
    expect(tassel!.max.z).toBeGreaterThan(
      (crown!.min.z + crown!.max.z) / 2 + 20,
    );
    expect(gold!.max.y).toBeLessThan(board!.min.y);
    expect(gold!.min.y).toBeGreaterThan(tassel!.min.y);
  });

  it('carries its baked shade: darker where the board covers the crown', () => {
    const shade = cap.crown.getAttribute('color');
    let [low, high] = [1, 0];
    for (let k = 0; k < shade.count; k++) {
      low = Math.min(low, shade.getX(k));
      high = Math.max(high, shade.getX(k));
    }
    expect(high).toBeGreaterThan(0.8);
    expect(low).toBeLessThan(0.5);
  });
});
