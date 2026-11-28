import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { gunzipSync } from 'node:zlib';

import { BufferAttribute, BufferGeometry, Vector3 } from 'three';
import { describe, expect, it } from 'vitest';

import { ARM, fitGlasses, UNIT_MM } from './fitGlasses';
import { decodeGlasses, GLASSES_PARTS } from './glassesGeometry';
import { headDepth } from './headDepthFixture';
import { meshes } from './headFixture';
import { centre } from './skull';

const unzipped = gunzipSync(readFileSync(join(__dirname, 'files/glasses.bin')));
const glasses = decodeGlasses(
  unzipped.buffer.slice(
    unzipped.byteOffset,
    unzipped.byteOffset + unzipped.byteLength,
  ) as ArrayBuffer,
);
const middle = (name: string) => {
  const g = new BufferGeometry();
  g.setAttribute(
    'position',
    new BufferAttribute(meshes.get(name)!.positions, 3),
  );
  return centre(g);
};
const fitted = fitGlasses(glasses, middle('leftEye'), middle('rightEye'));

describe('the sunglasses on the head', () => {
  const { positions } = meshes.get('skin')!;
  const points = (part: (typeof GLASSES_PARTS)[number], step: number) => {
    const { array } = fitted[part].getAttribute('position');
    const out: Vector3[] = [];
    for (let k = 0; k < array.length; k += 3 * step)
      out.push(new Vector3().fromArray(array, k));
    return out;
  };

  const worn = (part: (typeof GLASSES_PARTS)[number]) => ({
    real: glasses[part].getAttribute('position').array,
    worn: fitted[part].getAttribute('position').array,
  });
  const apart = (a: ArrayLike<number>, i: number, j: number) =>
    new Vector3()
      .fromArray(a as number[], i)
      .distanceTo(new Vector3().fromArray(a as number[], j));

  it('is the real pair, its front and lenses unbent', () => {
    for (const part of ['frame', 'lenses'] as const) {
      const at = worn(part);
      const last = at.real.length - 3;
      for (let k = 0; k < last; k += 3 * 97)
        expect(apart(at.worn, k, last) * UNIT_MM).toBeCloseTo(
          apart(at.real, k, last),
          1,
        );
    }
  });

  it('only lengthens, flexes and curls its arms: nothing on them is stretched further', () => {
    for (const part of ['left', 'right', 'leftText', 'rightText'] as const) {
      const at = worn(part);
      // Points near each other stay as far apart, but for the arm's length
      // and the little the curl behind the ear adds.
      for (let k = 0; k + 9 < at.real.length; k += 3 * 41) {
        const real = apart(at.real, k, k + 3);
        if (real < 1) continue;
        const ratio = (apart(at.worn, k, k + 3) * UNIT_MM) / real;
        expect(ratio).toBeGreaterThan(0.9);
        expect(ratio).toBeLessThan(1.15 * ARM);
      }
    }
  });

  it('has arms running straight back past the temples, close to the head', () => {
    for (const part of ['left', 'right'] as const) {
      const beside = points(part, 3).filter((p) => p.z > -15 && p.z < 15);
      const out = beside.map((p) => Math.abs(p.x - middle('skin').x));
      expect(Math.max(...out)).toBeLessThan(47);
    }
  });

  it('has the eyes in the middle of its lenses, its front no wider than the head', () => {
    fitted.lenses.computeBoundingBox();
    fitted.frame.computeBoundingBox();
    const lens = fitted.lenses.boundingBox!;
    const eye = middle('leftEye');
    const eyes = middle('rightEye').sub(eye).length();
    // Each lens's middle is under a tenth of the eyes' distance from its eye.
    const right = points('lenses', 1).filter((p) => p.x > 0);
    const xs = right.map((p) => p.x);
    const centreX = (Math.max(...xs) + Math.min(...xs)) / 2;
    expect(Math.abs(centreX - eye.x)).toBeLessThan(eyes * 0.1);
    expect(eye.y).toBeGreaterThan(lens.min.y);
    expect(eye.y).toBeLessThan(lens.max.y);
    const { min, max } = fitted.frame.boundingBox!;
    expect(max.x - min.x).toBeLessThan(84);
  });

  it('sinks into the head nowhere', () => {
    for (const part of GLASSES_PARTS)
      for (const p of points(part, 5))
        expect(headDepth(p), part).toBeLessThan(0.5);
  }, 60_000);

  it('rests its bridge on the nose', () => {
    const gap = Math.min(
      ...points('frame', 1)
        .filter((p) => Math.abs(p.x) < 8)
        .map((p) => -headDepth(p))
        .filter(Number.isFinite),
    );
    expect(gap).toBeLessThan(1);
  }, 60_000);

  it('runs its arms over the tops of the ears, their tips behind them', () => {
    // The ears: the skin's points standing out past the skull.
    const ears: Vector3[] = [];
    for (let i = 0; i < positions.length; i += 3)
      if (Math.abs(positions[i]!) > 45 && positions[i + 1]! > -30)
        ears.push(new Vector3().fromArray(positions, i));
    for (const [part, side] of [
      ['left', 1],
      ['right', -1],
    ] as const) {
      const ear = ears.filter((p) => p.x * side > 0);
      const highest = ear.reduce((a, b) => (b.y > a.y ? b : a));
      const top = highest.y;
      const back = Math.min(...ear.map((p) => p.z));
      const arm = points(part, 1);
      // Angled down onto the ear: at its top the arm rests in the fold
      // just inside it, level with it or a little under, not up off it.
      const over = arm.filter((p) => Math.abs(p.z - highest.z) < 3);
      const under = Math.min(...over.map((p) => p.y));
      expect(under - top).toBeGreaterThan(-4);
      expect(under - top).toBeLessThan(0.5);
      // And touches it there: the arm comes within a few tenths of a unit
      // (under a millimetre) of the skin round the ear's top.
      const gap = Math.min(
        ...arm
          .filter((p) => p.z < highest.z + 6 && p.z > highest.z - 10)
          .map((p) => -headDepth(p))
          .filter(Number.isFinite),
      );
      expect(gap, part).toBeLessThan(0.3);
      // Its tip is behind the ear, and hooks down below its top.
      const tip = arm.filter((p) => p.z < back);
      expect(tip.length).toBeGreaterThan(0);
      expect(Math.min(...tip.map((p) => p.y))).toBeLessThan(top);
    }
  });
});
