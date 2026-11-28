import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

import { BufferAttribute, BufferGeometry } from 'three';
import { describe, expect, it } from 'vitest';

import { decodeHead, type HeadMesh } from './headGeometry';
import { unpackHead } from './headPack';
import { morphGeometry } from './morphGeometry';
import { SHOWN_EXPRESSIONS, SHOWN_SIDED } from './shownExpressions';
import { withSides } from './sideMorphs';

// The page's own head file, as MyHead.tsx reads it.
const { meshes } = withSides(
  decodeHead(
    unpackHead(
      zlib.gunzipSync(fs.readFileSync(path.join(__dirname, 'files/head.bin'))),
    ),
    SHOWN_EXPRESSIONS,
  ),
  SHOWN_SIDED,
);

// Each expression's normal turn the long way: three's normals of the whole
// posed shape, less its normals at rest.
const normalsOf = (part: HeadMesh, positions: Float32Array) => {
  const shape = new BufferGeometry();
  shape.setAttribute('position', new BufferAttribute(positions, 3));
  shape.setIndex(new BufferAttribute(part.indices, 1));
  shape.computeVertexNormals();
  return shape.getAttribute('normal').array as Float32Array;
};

describe("the head's expressions", () => {
  it("turn the normals as three's normals of each whole posed shape do", () => {
    const skin = meshes.get('skin')!;
    const geometry = morphGeometry(skin);
    const rest = normalsOf(skin, skin.positions);
    const turns = geometry.morphAttributes.normal!;
    expect(turns).toHaveLength(skin.morphs.length);
    skin.morphs.forEach(({ indices, moves }, m) => {
      const posed = skin.positions.slice();
      indices.forEach((v, k) => {
        for (let axis = 0; axis < 3; axis++)
          posed[v * 3 + axis]! += moves[k * 3 + axis]!;
      });
      const whole = normalsOf(skin, posed);
      const turn = turns[m]!.array;
      let worst = 0;
      for (let i = 0; i < whole.length; i++)
        worst = Math.max(worst, Math.abs(whole[i]! - rest[i]! - turn[i]!));
      expect(worst, `expression ${m}`).toBeLessThan(1e-4);
    });
  });

  it('build in under half the time the whole shapes took', () => {
    // The page built them the long way, about a third of a second on a fast
    // laptop (and in a memo the scene's loading threw away, five times).
    const skin = meshes.get('skin')!;
    const time = (work: () => void) => {
      const start = performance.now();
      work();
      return performance.now() - start;
    };
    const quick = Math.min(
      ...[0, 1].map(() => time(() => morphGeometry(skin))),
    );
    const long = time(() => {
      for (const { indices, moves } of skin.morphs) {
        const posed = skin.positions.slice();
        indices.forEach((v, k) => {
          for (let axis = 0; axis < 3; axis++)
            posed[v * 3 + axis]! += moves[k * 3 + axis]!;
        });
        normalsOf(skin, posed);
      }
    });
    expect(quick).toBeLessThan(long / 2);
  });
});
