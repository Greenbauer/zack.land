import { describe, expect, it } from 'vitest';

import { front, joinY, meshes, openEdges, Point, skin } from './headFixture';
import {
  FADE_BOTTOM,
  FADE_NOISE,
  FADE_TOP,
  HAZE_CLEAR,
  HAZE_VEIL,
} from './neckFade';

describe('the head joined to its neck and shoulders', () => {
  it('is one connected surface, open only at the eyes, the lips (sealed by the mouth) and where the fade hides the cut', () => {
    // The mouth pocket's points, by position: the lips' edge must be among them.
    const mouth = meshes.get('mouth')!.positions;
    const key = (p: ArrayLike<number>, at = 0) =>
      [0, 1, 2].map((a) => p[at + a]!.toFixed(3)).join();
    const sealed = new Set(
      Array.from({ length: mouth.length / 3 }, (_, i) => key(mouth, i * 3)),
    );
    const reached = new Set([0]);
    let grew = true;
    while (grew) {
      grew = false;
      for (const face of skin.faces)
        if (
          face.some((i) => reached.has(i)) &&
          face.some((i) => !reached.has(i))
        ) {
          face.forEach((i) => reached.add(i));
          grew = true;
        }
    }
    expect(reached.size).toBe(skin.vertices.length);
    for (const key of openEdges()) {
      const [y1, y2] = key.split(',').map((i) => skin.vertices[Number(i)]![1]);
      // The eye sockets, where the eyes sit: either side of the nose, at eye
      // height, on the face.
      const atEyes = [y1, y2].every((_, k) => {
        const [x, y, z] = skin.vertices[Number(key.split(',')[k])]!;
        return (
          Math.abs(x) > 5 && Math.abs(x) < 32 && y > -10 && y < 15 && z > 15
        );
      });
      // The fade edge moves by up to half the noise's range above the
      // surface, so the bust's cut has to sit that far below its end.
      const hidden = FADE_BOTTOM - FADE_NOISE / 2;
      const atCut = y1! < hidden && y2! < hidden;
      const atLips = key
        .split(',')
        .every((i) =>
          sealed.has(skin.vertices[Number(i)]!.map((c) => c.toFixed(3)).join()),
        );
      expect(atEyes || atCut || atLips).toBe(true);
    }
  });

  it('turns smoothly through the join at the back of the neck', () => {
    // The surface's tilt (normal y) in 1-unit bands either side of the join,
    // along the back of the neck: no band may differ from the next by more
    // than a gentle curve's step.
    const bands = new Map<number, number[]>();
    for (const face of skin.faces) {
      const [a, b, c] = face.map((i) => skin.vertices[i]!) as [
        Point,
        Point,
        Point,
      ];
      const centre = [0, 1, 2].map((k) => (a[k]! + b[k]! + c[k]!) / 3) as Point;
      if (Math.abs(centre[0]) > 10 || centre[2] > -30) continue;
      const band = Math.round(centre[1] - joinY(centre[2]));
      if (Math.abs(band) > 8) continue;
      const u = b.map((v, k) => v - a[k]!);
      const w = c.map((v, k) => v - a[k]!);
      const n = [
        u[1]! * w[2]! - u[2]! * w[1]!,
        u[2]! * w[0]! - u[0]! * w[2]!,
        u[0]! * w[1]! - u[1]! * w[0]!,
      ];
      const length = Math.hypot(...n);
      if (length) bands.set(band, [...(bands.get(band) ?? []), n[1]! / length]);
    }
    const tilt = [...bands.keys()]
      .sort((p, q) => q - p)
      .map((band) => {
        const values = bands.get(band)!;
        return values.reduce((s, v) => s + v, 0) / values.length;
      });
    expect(tilt.length).toBeGreaterThan(12);
    for (let k = 1; k < tilt.length; k++)
      expect(Math.abs(tilt[k]! - tilt[k - 1]!)).toBeLessThan(0.1);
  });

  it('turns smoothly through the join under the chin', () => {
    // As at the back: the surface's tilt in 1-unit bands either side of the
    // join, down the front of the throat. The turn from the underside of the
    // chin into the throat is the sharpest step it takes; a seam left
    // unsmoothed there steps twice as far.
    const bands = new Map<number, number[]>();
    for (const face of skin.faces) {
      const [a, b, c] = face.map((i) => skin.vertices[i]!) as [
        Point,
        Point,
        Point,
      ];
      const centre = [0, 1, 2].map((k) => (a[k]! + b[k]! + c[k]!) / 3) as Point;
      if (Math.abs(centre[0]) > 10 || centre[2] < 0) continue;
      const band = Math.round(centre[1] - joinY(centre[2]));
      if (Math.abs(band) > 8) continue;
      const u = b.map((v, k) => v - a[k]!);
      const w = c.map((v, k) => v - a[k]!);
      const n = [
        u[1]! * w[2]! - u[2]! * w[1]!,
        u[2]! * w[0]! - u[0]! * w[2]!,
        u[0]! * w[1]! - u[1]! * w[0]!,
      ];
      const length = Math.hypot(...n);
      if (length) bands.set(band, [...(bands.get(band) ?? []), n[1]! / length]);
    }
    const tilt = [...bands.keys()]
      .sort((p, q) => q - p)
      .map((band) => {
        const values = bands.get(band)!;
        return values.reduce((s, v) => s + v, 0) / values.length;
      });
    expect(tilt.length).toBeGreaterThan(12);
    for (let k = 1; k < tilt.length; k++)
      expect(Math.abs(tilt[k]! - tilt[k - 1]!)).toBeLessThan(0.3);
  });

  it("has an Adam's apple and a neck that widens into shoulders", () => {
    // The throat slopes back as it goes down; at the Adam's apple it bulges
    // forward of the straight line from the throat above it to the throat
    // below it.
    const apple = front(-84, -88);
    const line = (front(-75, -79) + front(-95, -99)) / 2;
    expect(apple).toBeGreaterThan(line + 1.5);
    const widest = (top: number, bottom: number) =>
      Math.max(
        ...skin.vertices
          .filter(([, y]) => y <= top && y > bottom)
          .map(([x]) => Math.abs(x)),
      );
    expect(widest(-56, -60)).toBeLessThan(40);
    expect(widest(-114, -122)).toBeGreaterThan(110);
  });

  it('runs the throat down without a wave', () => {
    // From under the chin to the base of the throat the front rises once, at
    // the Adam's apple: no second ridge or collar.
    const profile: number[] = [];
    for (let top = -76; top > -110; top -= 3) profile.push(front(top, top - 3));
    const peaks = profile.filter(
      (z, k) =>
        k > 0 &&
        k < profile.length - 1 &&
        z > profile[k - 1]! + 0.1 &&
        z > profile[k + 1]! + 0.1,
    );
    expect(peaks.length).toBeLessThanOrEqual(1);
  });

  it('has no ridge running round the neck', () => {
    // How sharply the surface bends outward at each point of the neck below
    // the chin, measured over its neighbours within 6 units (the Adam's apple
    // aside). A blend that closes the gap between head and body too fast left
    // a ridge round the neck that measured 0.045; the neck itself stays near
    // 0.02.
    const normal = skin.vertices.map((): Point => [0, 0, 0]);
    for (const face of skin.faces) {
      const [a, b, c] = face.map((i) => skin.vertices[i]!) as [
        Point,
        Point,
        Point,
      ];
      const u = b.map((v, k) => v - a[k]!);
      const w = c.map((v, k) => v - a[k]!);
      const n = [
        u[1]! * w[2]! - u[2]! * w[1]!,
        u[2]! * w[0]! - u[0]! * w[2]!,
        u[0]! * w[1]! - u[1]! * w[0]!,
      ];
      for (const i of face)
        normal[i] = normal[i]!.map((v, k) => v + n[k]!) as Point;
    }
    const axis = (y: number) => -20 + (y + 72) * 0.2;
    let sharpest = 0;
    skin.vertices.forEach(([x, y, z], i) => {
      if (y > -72 || y < -104 || Math.hypot(x, z - axis(y)) > 45) return;
      if (Math.abs(x) < 10 && z > 0 && y < -78 && y > -98) return;
      const n = normal[i]!;
      const length = Math.hypot(...n);
      let sum = 0;
      let count = 0;
      for (const [px, py, pz] of skin.vertices) {
        const d = [px - x, py - y, pz - z];
        const r2 = d[0]! ** 2 + d[1]! ** 2 + d[2]! ** 2;
        if (r2 > 36 || r2 < 1e-6) continue;
        sum += (d[0]! * n[0] + d[1]! * n[1] + d[2]! * n[2]) / length / r2;
        count++;
      }
      if (count) sharpest = Math.max(sharpest, sum / count);
    });
    expect(sharpest).toBeLessThan(0.032);
  });

  it('shows the collarbones', () => {
    // Along each collarbone the chest's front stands out past the surface
    // 8 units above it (the hollow over it) and 8 below.
    const at = (across: number, y: number) =>
      Math.max(
        ...skin.vertices
          .filter(
            ([x, vy]) =>
              Math.abs(Math.abs(x) - across) < 1.5 && Math.abs(vy - y) < 1.5,
          )
          .map(([, , z]) => z),
      );
    for (const [across, y] of [
      [30, -117],
      [42, -115],
      [54, -113],
    ] as const)
      expect(
        at(across, y) - (at(across, y + 8) + at(across, y - 8)) / 2,
      ).toBeGreaterThan(0.8);
  });

  it('curves the neck into the trapezius without a crease', () => {
    // How sharply the surface bends inward where the side and back of the
    // neck meet the trapezius, over each point's neighbours within 6 units.
    // A trapezius raised over too short a height left a crease there that
    // measured 0.040; the curve the back photo shows stays near 0.031.
    const normal = skin.vertices.map((): Point => [0, 0, 0]);
    for (const face of skin.faces) {
      const [a, b, c] = face.map((i) => skin.vertices[i]!) as [
        Point,
        Point,
        Point,
      ];
      const u = b.map((v, k) => v - a[k]!);
      const w = c.map((v, k) => v - a[k]!);
      const n = [
        u[1]! * w[2]! - u[2]! * w[1]!,
        u[2]! * w[0]! - u[0]! * w[2]!,
        u[0]! * w[1]! - u[1]! * w[0]!,
      ];
      for (const i of face)
        normal[i] = normal[i]!.map((v, k) => v + n[k]!) as Point;
    }
    let deepest = 0;
    skin.vertices.forEach(([x, y, z], i) => {
      const across = Math.abs(x);
      if (across < 26 || across > 60 || y > -58 || y < -100 || z > 0) return;
      const n = normal[i]!;
      const length = Math.hypot(...n);
      let sum = 0;
      let count = 0;
      for (const [px, py, pz] of skin.vertices) {
        const d = [px - x, py - y, pz - z];
        const r2 = d[0]! ** 2 + d[1]! ** 2 + d[2]! ** 2;
        if (r2 > 36 || r2 < 1e-6) continue;
        sum += (d[0]! * n[0] + d[1]! * n[1] + d[2]! * n[2]) / length / r2;
        count++;
      }
      if (count) deepest = Math.min(deepest, sum / count);
    });
    expect(deepest).toBeGreaterThan(-0.036);
  });

  it('runs the chest on down from the collarbones, with no hollow', () => {
    // Below each collarbone the front of the chest only comes forward, into
    // the pectoral, as in the reference photos.
    const at = (across: number, y: number) =>
      Math.max(
        ...skin.vertices
          .filter(
            ([x, vy, z]) =>
              Math.abs(Math.abs(x) - across) < 1.5 &&
              Math.abs(vy - y) < 1.5 &&
              z > -40,
          )
          .map(([, , z]) => z),
      );
    for (const across of [25, 40])
      for (let y = -120; y > -144; y -= 4)
        expect(at(across, y - 4)).toBeGreaterThan(at(across, y) - 0.5);
  });

  it('carries defined pectorals', () => {
    // Below the collarbones each pectoral stands well forward of the
    // breastbone between them.
    expect(front(-155, -175, 35, 45)).toBeGreaterThan(
      front(-155, -175, 0, 3) + 5,
    );
  });

  it('runs the back of the neck straight down from the skull', () => {
    // Going down the back of the neck the surface only ever moves back: no
    // waist under the skull.
    const back = (top: number) =>
      Math.min(
        ...skin.vertices
          .filter(([x, y]) => Math.abs(x) < 3 && y <= top && y > top - 4)
          .map(([, , z]) => z),
      );
    for (let top = -48; top > -132; top -= 4)
      expect(back(top)).toBeLessThan(back(top + 4) + 0.3);
  });

  it('slopes from the neck to the shoulders over high trapezius', () => {
    // The top of the trapezius at each distance from the midline, against
    // the stage photo (the average of its two sides, which the head's tilt
    // in that photo raises on one and lowers on the other): within 5 units.
    const top = (across: number) =>
      Math.max(
        ...skin.vertices
          .filter(([x, y]) => Math.abs(Math.abs(x) - across) < 2 && y < -40)
          .map(([, y]) => y),
      );
    const photo = [
      [41, -63],
      [46, -68],
      [55, -73],
      [65, -80],
      [75, -85],
      [85, -86],
    ] as const;
    for (const [across, y] of photo)
      expect(Math.abs(top(across) - y)).toBeLessThan(5);
  });

  it('turns the head on the neck and leaves the shoulders still', () => {
    // Each vertex's head weight (how much of the head's turn it takes): the
    // whole skull 1, so it turns without bending; the shoulders and chest 0;
    // and between them no edge jumps, so the neck twists without a crease.
    const weights = meshes.get('skin')!.headWeights;
    const weight = (i: number) => weights[i]! / 255;
    skin.vertices.forEach(([x, y, z], i) => {
      if (y - joinY(z) > 0) expect(weight(i)).toBeGreaterThan(0.98);
      if (Math.abs(x) > 70 || y < -140) expect(weight(i)).toBeLessThan(0.02);
    });
    let step = 0;
    for (const face of skin.faces)
      face.forEach((a, k) => {
        const b = face[(k + 1) % face.length]!;
        step = Math.max(step, Math.abs(weight(a) - weight(b)));
      });
    expect(step).toBeLessThan(0.15);
    // The eyes turn with the head.
    for (const eye of ['rightEye', 'leftEye'])
      expect(meshes.get(eye)!.headWeights.every((w) => w === 255)).toBe(true);
  });

  it('keeps the chin clear of the haze', () => {
    // The haze's top drifts by up to half the noise's range, so at worst it
    // reaches the lowest point of the chin that much higher: even then the
    // chin stays fully opaque and the veil over it stays under 3%.
    const chin = Math.min(
      ...skin.vertices
        .filter(([x, y, z]) => Math.abs(x) < 20 && y > -100 && z > 15)
        .map(([, y]) => y),
    );
    const t = Math.min(
      Math.max(
        (chin - FADE_NOISE / 2 - FADE_BOTTOM) / (FADE_TOP - FADE_BOTTOM),
        0,
      ),
      1,
    );
    const fog = 1 - t * t * (3 - 2 * t);
    expect(fog).toBeLessThan(HAZE_CLEAR);
    expect(fog * HAZE_VEIL).toBeLessThan(0.03);
  });
});
