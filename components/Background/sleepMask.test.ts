import { Vector3 } from 'three';
import { describe, expect, it } from 'vitest';

import { meshes } from './headFixture';
import { sleepMask } from './sleepMask';

const middle = (name: string) => {
  const p = meshes.get(name)!.positions;
  const sum = new Vector3();
  for (let k = 0; k < p.length; k += 3)
    sum.add(new Vector3(p[k], p[k + 1], p[k + 2]));
  return sum.divideScalar(p.length / 3);
};

describe("the smart bed's sleep mask", () => {
  const left = middle('leftEye');
  const right = middle('rightEye');
  const eyes = left.clone().add(right).multiplyScalar(0.5);
  const spread = left.distanceTo(right);
  const skin = meshes.get('skin')!;
  const mask = sleepMask(skin.positions, eyes, spread);
  const position = mask.getAttribute('position');
  const points = Array.from({ length: position.count }, (_, i) =>
    new Vector3().fromBufferAttribute(position, i),
  );

  it('covers both eyes, in front of them', () => {
    for (const eye of [left, right]) {
      const before = points.filter(
        (p) =>
          Math.abs(p.x - eye.x) < spread * 0.2 &&
          Math.abs(p.y - eye.y) < spread * 0.2,
      );
      expect(before.length).toBeGreaterThan(0);
      expect(Math.max(...before.map((p) => p.z))).toBeGreaterThan(eye.z);
    }
  });

  it('bridges the eye sockets: nothing of it dips in behind the eyes', () => {
    for (const eye of [left, right]) {
      const over = points.filter(
        (p) =>
          Math.abs(p.x - eye.x) < spread * 0.15 &&
          Math.abs(p.y - eye.y) < spread * 0.15,
      );
      for (const p of over) expect(p.z).toBeGreaterThan(eye.z);
    }
  });

  it('faces out, away from the head', () => {
    mask.computeVertexNormals();
    const normal = mask.getAttribute('normal');
    const front = points.findIndex(
      (p) => Math.abs(p.x - eyes.x) < spread * 0.1 && p.y > eyes.y,
    );
    expect(normal.getZ(front)).toBeGreaterThan(0);
  });

  it('goes all round the head, its strap above the eyes at the back', () => {
    const back = points.filter((p) => p.z < eyes.z - spread * 2);
    expect(back.length).toBeGreaterThan(0);
    for (const p of back) expect(p.y).toBeGreaterThan(eyes.y + spread * 0.3);
  });
});
