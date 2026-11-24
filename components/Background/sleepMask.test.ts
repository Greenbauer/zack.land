import { Vector2, Vector3 } from 'three';
import { describe, expect, it } from 'vitest';

import { meshes } from './headFixture';
import {
  edgeDistance,
  headProfile,
  maskOutline,
  outlineBounds,
  sleepMask,
} from './sleepMask';

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
  const skin = meshes.get('skin')!.positions;
  const profile = headProfile(skin, eyes, spread);
  const mask = sleepMask(profile);
  const outline = maskOutline();
  const bounds = outlineBounds(outline);
  // The pad's points that are inside its outline (the rest are cut away by
  // its print).
  const pad = (() => {
    const position = mask.pad.getAttribute('position');
    const uv = mask.pad.getAttribute('uv');
    const kept: Vector3[] = [];
    for (let i = 0; i < position.count; i++) {
      const at = new Vector2(
        bounds.left + uv.getX(i) * (bounds.right - bounds.left),
        bounds.low + uv.getY(i) * (bounds.high - bounds.low),
      );
      if (edgeDistance(at, outline) > 0.02)
        kept.push(new Vector3().fromBufferAttribute(position, i));
    }
    return kept;
  })();
  // The skin's frontmost depth near (x, y).
  const front = (x: number, y: number) => {
    let z = -Infinity;
    for (let k = 0; k < skin.length; k += 3)
      if (Math.abs(skin[k]! - x) < 2 && Math.abs(skin[k + 1]! - y) < 2)
        z = Math.max(z, skin[k + 2]!);
    return z;
  };

  it('is shaped like a sleep mask: wider than tall, notched over the nose', () => {
    expect(bounds.right - bounds.left).toBeGreaterThan(
      2 * (bounds.high - bounds.low),
    );
    expect(edgeDistance(new Vector2(0, -0.2), outline)).toBeLessThan(0);
    expect(edgeDistance(new Vector2(0.5, -0.2), outline)).toBeGreaterThan(0);
  });

  it('covers both eyes, in front of them', () => {
    for (const eye of [left, right]) {
      const over = pad.filter(
        (p) =>
          Math.abs(p.x - eye.x) < spread * 0.15 &&
          Math.abs(p.y - eye.y) < spread * 0.15,
      );
      expect(over.length).toBeGreaterThan(0);
      for (const p of over) expect(p.z).toBeGreaterThan(eye.z);
    }
  });

  it('never sinks into the face', () => {
    for (const p of pad.filter((_, k) => k % 37 === 0))
      if (p.z > eyes.z - spread * 0.6)
        expect(p.z).toBeGreaterThanOrEqual(front(p.x, p.y) - 0.5);
  });

  it('has its strap round the back of the head, above the eyes', () => {
    const position = mask.strap.getAttribute('position');
    let back = 0;
    for (let i = 0; i < position.count; i++) {
      const p = new Vector3().fromBufferAttribute(position, i);
      if (p.z < eyes.z - spread * 2) back++;
      expect(p.y).toBeGreaterThan(eyes.y + spread * 0.2);
    }
    expect(back).toBeGreaterThan(0);
  });

  it('has long lashes standing out from it', () => {
    mask.lashes.computeBoundingBox();
    expect(mask.lashes.boundingBox!.max.z).toBeGreaterThan(
      Math.max(...pad.map((p) => p.z)),
    );
  });
});
