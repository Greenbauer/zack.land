import { describe, expect, it } from 'vitest';

import PHOTO_BACK from '../../scripts/head/photoBack.json';
import { bends, joinY, meshes, Point, skin } from './headFixture';

// The bust below the head (scripts/build-head.mjs, scripts/head/pose.mjs,
// scripts/head/sculpt.mjs) and where it meets the head, measured on the built
// head.bin against the reference photos.

describe('the bust under the head', () => {
  it('fills the back between the shoulder blades, the spine a groove lower down', () => {
    // The back-most skin at a height and distance from the midline.
    const back = (y: number, across: number) =>
      Math.min(
        ...skin.vertices
          .filter(
            ([x, vy]) =>
              Math.abs(Math.abs(x) - across) < 2 && Math.abs(vy - y) < 2,
          )
          .map(([, , z]) => z),
      );
    // Between the blades the spine sits under 7 units in front of them
    // (MakeHuman's base, a trough, had it 21 in front at -140; the back
    // photos show it full there).
    for (const y of [-120, -140])
      expect(back(y, 0) - back(y, 40)).toBeLessThan(7);
    // Lower down, the groove between the long muscles either side of it.
    expect(back(-185, 0) - back(-185, 32)).toBeGreaterThan(5);
  });

  it('rounds the back into the top of the raised trapezius', () => {
    // Raised over a narrow width and left unsmoothed there, the trapezius met
    // the back below it in a crease that measured -0.030 and caught the light
    // as a line; rounded, it measures -0.019.
    const deepest = Math.min(
      0,
      ...bends(
        ([x, y, z]) =>
          Math.abs(x) >= 30 &&
          Math.abs(x) <= 60 &&
          y <= -80 &&
          y >= -110 &&
          z <= -60,
      ),
    );
    expect(deepest).toBeGreaterThan(-0.024);
  });

  it('keeps the base of the back of the neck flat across, with no dip over the spine', () => {
    // The flat top of the trapezius over the lowest neck bone (scripts/head/
    // backOutline.mjs LEVEL). MakeHuman's trough there had the spine 4 to 7 units in
    // front of the muscles either side, a dark triangle under the neck.
    const back = (x: number, y: number) =>
      Math.min(
        ...skin.vertices
          .filter(
            ([vx, vy, z]) =>
              Math.abs(vx - x) < 2.5 && Math.abs(vy - y) < 2.5 && z < -30,
          )
          .map(([, , z]) => z),
      );
    for (const y of [-85, -90, -95, -100])
      expect(back(0, y) - back(10, y)).toBeLessThan(1.5);
  });

  it('keeps the outline of the side photo from the neck to the shoulder', () => {
    // scripts/head/backOutline.mjs: between the neck and the top of the back
    // the outline seen from the side keeps the photo's shape, held to the
    // bust's own outline at both ends, to within 3 units (5 mm). MakeHuman's
    // stood up to 6 units out behind it just under the neck, a knob at the
    // top of the trapezius.
    const outline = (y: number) => {
      let z = 0;
      for (const face of skin.faces)
        face.forEach((a, k) => {
          const [p, q] = [a, face[(k + 1) % face.length]!].map(
            (i) => skin.vertices[i]!,
          );
          if ((p![1] - y) * (q![1] - y) > 0 || p![1] === q![1]) return;
          const t = (y - p![1]) / (q![1] - p![1]);
          z = Math.min(z, p![2] + t * (q![2] - p![2]));
        });
      return z;
    };
    const photoAt = (y: number) => {
      const k = PHOTO_BACK.findIndex(([h]) => h! < y);
      const [[h0, z0], [h1, z1]] = [PHOTO_BACK[k - 1]!, PHOTO_BACK[k]!];
      return z0! + ((z1! - z0!) * (y - h0!)) / (h1! - h0!);
    };
    const [top, bottom] = [-50, -108];
    const shift = [top, bottom].map((y) => outline(y) - photoAt(y));
    for (let y = top; y >= bottom; y -= 2) {
      const along = (top - y) / (top - bottom);
      const photo = photoAt(y) + shift[0]! + (shift[1]! - shift[0]!) * along;
      expect(Math.abs(outline(y) - photo)).toBeLessThan(3);
    }
  });

  it('runs the back of the neck into the shoulders in one smooth curve, seen from the side', () => {
    // The outline of the back seen from the side: at each height, the
    // back-most point where the skin's triangles cross it.
    const outline = (y: number) => {
      let z = 0;
      for (const face of skin.faces)
        face.forEach((a, k) => {
          const [p, q] = [a, face[(k + 1) % face.length]!].map(
            (i) => skin.vertices[i]!,
          );
          if ((p![1] - y) * (q![1] - y) > 0 || p![1] === q![1]) return;
          const t = (y - p![1]) / (q![1] - p![1]);
          z = Math.min(z, p![2] + t * (q![2] - p![2]));
        });
      return z;
    };
    // How far it turns over each 3 units of height, from under the skull to
    // the top of the back: turning 45 degrees where the trapezius met the
    // back of the neck, it showed as a bump against a side photo, whose
    // back of the neck runs into the shoulders in one curve.
    const heights = Array.from({ length: 61 }, (_, k) => -40 - k);
    const z = heights.map(outline);
    for (let k = 3; k < heights.length - 3; k++) {
      const before = Math.atan2(3, z[k]! - z[k - 3]!);
      const after = Math.atan2(3, z[k + 3]! - z[k]!);
      expect(Math.abs(before - after) * (180 / Math.PI)).toBeLessThan(20);
    }
  });

  it('leaves no ring round the neck where the head is joined on', () => {
    // How far each point of the neck near the seam stands off the middle of
    // its neighbours, along the surface's normal and over the edges' length,
    // averaged per unit of height over the seam: a ring shows as one height
    // standing out. The ironing's and the rebuild's edges each left one,
    // measuring 0.027 round the back and 0.033 toward the throat; the neck
    // either side stays near 0.01.
    const near = skin.vertices.map(() => new Set<number>());
    const normal = skin.vertices.map((): Point => [0, 0, 0]);
    for (const face of skin.faces) {
      const [a, b, c] = face.map((i) => skin.vertices[i]!);
      const u = b!.map((v, k) => v - a![k]!);
      const w = c!.map((v, k) => v - a![k]!);
      const n = [
        u[1]! * w[2]! - u[2]! * w[1]!,
        u[2]! * w[0]! - u[0]! * w[2]!,
        u[0]! * w[1]! - u[1]! * w[0]!,
      ];
      face.forEach((i, k) => {
        near[i]!.add(face[(k + 1) % 3]!).add(face[(k + 2) % 3]!);
        normal[i] = normal[i]!.map((v, j) => v + n[j]!) as Point;
      });
    }
    const rings = new Map<string, [number, number]>();
    skin.vertices.forEach((p, i) => {
      const h = Math.round(p[1] - joinY(p[2]));
      const axis = -25 + (p[1] + 72) * 0.43;
      const out = Math.hypot(p[0], p[2] - axis);
      const ahead = (p[2] - axis) / out;
      if (h < -24 || h > 20 || out > 55 || ahead > 0.95 || !near[i]!.size)
        return;
      const n = normal[i]!;
      const length = Math.hypot(...n);
      const mean = [0, 1, 2].map(
        (k) =>
          [...near[i]!].reduce((s, j) => s + skin.vertices[j]![k]!, 0) /
          near[i]!.size,
      );
      const edge =
        [...near[i]!].reduce(
          (s, j) =>
            s + Math.hypot(...skin.vertices[j]!.map((c, k) => c - p[k]!)),
          0,
        ) / near[i]!.size;
      const off = Math.abs(
        mean.reduce((s, c, k) => s + ((c - p[k]!) * n[k]!) / length, 0),
      );
      const key = `${ahead > 0.4 ? 'front' : 'back'} ${h}`;
      const [sum, count] = rings.get(key) ?? [0, 0];
      rings.set(key, [sum + off / edge, count + 1]);
    });
    for (const [key, [sum, count]] of rings)
      if (key.startsWith('back') || Math.abs(Number(key.split(' ')[1])) < 6)
        expect(sum / count, key).toBeLessThan(0.022);
  });

  it('hangs the arms down at the sides, with no skin folded over', () => {
    // The middle of each arm at two heights above the bust's cut (the skin
    // out past the ribs): MakeHuman's arms stand 40 degrees out from
    // vertical; hanging, they are within 10 of it.
    const middle = (y: number, side: number) => {
      const arm = skin.vertices.filter(
        ([x, vy]) => side * x > 96 && Math.abs(vy - y) < 1.5,
      );
      return [0, 2].map(
        (a) =>
          (Math.min(...arm.map((p) => p[a]!)) +
            Math.max(...arm.map((p) => p[a]!))) /
          2,
      );
    };
    for (const side of [-1, 1]) {
      const [upper, lower] = [middle(-170, side), middle(-190, side)];
      const out = side * (lower[0]! - upper[0]!);
      expect(Math.abs(Math.atan2(out, 20) * (180 / Math.PI))).toBeLessThan(10);
    }
    // Lowered, the arm crushed the back of each armpit against the side until
    // its skin folded over; no two neighbouring triangles of the bust face
    // more than 100 degrees apart.
    const facing = skin.faces.map((face) => {
      const [a, b, c] = face.map((i) => skin.vertices[i]!);
      const u = b!.map((v, k) => v - a![k]!);
      const w = c!.map((v, k) => v - a![k]!);
      const n = [
        u[1]! * w[2]! - u[2]! * w[1]!,
        u[2]! * w[0]! - u[0]! * w[2]!,
        u[0]! * w[1]! - u[1]! * w[0]!,
      ];
      const length = Math.hypot(...n) || 1;
      return n.map((v) => v / length);
    });
    const sharing = new Map<string, number[]>();
    skin.faces.forEach((face, t) =>
      face.forEach((a, k) => {
        const b = face[(k + 1) % 3]!;
        const key = a < b ? `${a},${b}` : `${b},${a}`;
        sharing.set(key, [...(sharing.get(key) ?? []), t]);
      }),
    );
    for (const [key, faces] of sharing) {
      if (faces.length !== 2) continue;
      if (skin.vertices[Number(key.split(',')[0])]![1] > -100) continue;
      const [p, q] = faces.map((t) => facing[t]!);
      expect(
        p![0]! * q![0]! + p![1]! * q![1]! + p![2]! * q![2]!,
      ).toBeGreaterThan(-0.17);
    }
  });

  // The share of a turn to the side each skin vertex takes.
  const turns = meshes.get('skin')!.turnWeights;
  const turn = (i: number) => turns[i]! / 255;

  it('turns the whole jaw with the face, the shoulder tips not at all', () => {
    // The jaw is one bone: every point of it turns as far as the face. With
    // the skull's share faded in by height alone, the chin (lower than the
    // back of the skull) took 13% less of the turn and the jaw sheared. (The
    // soft skin under the chin, behind z 20, turns a little less: it
    // stretches as the jaw swings over the throat.)
    const weights = meshes.get('skin')!.headWeights;
    skin.vertices.forEach(([x, y, z], i) => {
      if (z > 20 && y > -82 && y < -40 && weights[i]! > 250)
        expect(turn(i)).toBeGreaterThan(0.97);
      // The skull, from the base of it up, turns whole.
      if (y - joinY(z) > 0 && y > -40) expect(turn(i)).toBeGreaterThan(0.98);
      if (Math.abs(x) > 115 || y < -175) expect(turn(i)).toBeLessThan(0.02);
    });
    // Between them no edge jumps, so the neck twists without a crease.
    let step = 0;
    for (const face of skin.faces)
      face.forEach((a, k) => {
        const b = face[(k + 1) % face.length]!;
        step = Math.max(step, Math.abs(turn(a) - turn(b)));
      });
    expect(step).toBeLessThan(0.15);
  });

  it('turns the neck a little more at each joint up it', () => {
    // A real neck turns about half at the joint under the skull and a
    // little at each joint below (scripts/head/rig.mjs turnWeights), so the
    // skin turns more the higher it sits. The throat, held to the lower
    // joints, stays facing forward while the jaw swings over it: turned
    // with the head's weights, it turned with the head down to the Adam's
    // apple (0.76 of the turn at -90) and the neck turned as one piece.
    const axisZ = (y: number) => -25 + (y + 72) * 0.43;
    // The skin at the front or back of the neck on its middle, at y.
    const midline = (y: number, front: boolean) => {
      let best = -1;
      skin.vertices.forEach(([x, vy, z], i) => {
        if (Math.abs(x) > 3 || Math.abs(vy - y) > 2) return;
        if (front !== z > axisZ(vy)) return;
        if (
          best < 0 ||
          (front ? z > skin.vertices[best]![2] : z < skin.vertices[best]![2])
        )
          best = i;
      });
      return turn(best);
    };
    const throat = [-125, -110, -95, -80].map((y) => midline(y, true));
    const nape = [-90, -70, -55, -45].map((y) => midline(y, false));
    for (const shares of [throat, nape])
      shares.slice(1).forEach((share, k) => {
        expect(share).toBeGreaterThan(shares[k]!);
      });
    expect(throat[0]).toBeLessThan(0.05);
    // The Adam's apple a third of the turn at most, under the chin a half.
    expect(midline(-90, true)).toBeLessThan(0.35);
    expect(throat[3]).toBeLessThan(0.5);
    expect(nape[3]).toBeGreaterThan(0.75);
  });

  it('turns the upper trapezius a little with the neck, its base barely', () => {
    // The trapezius joins the neck to the shoulders, so as the head turns
    // the top of it turns a little too (scripts/head/rig.mjs TRAPEZIUS,
    // BACK). With none, the twist stopped dead at the base of the neck and
    // the skin there sheared against a still trapezius; with a quarter of
    // the turn, the base of the back of the neck and the top of the
    // trapezius slid 23 mm sideways in a full turn, where a real one, held
    // to the lowest joints of the spine, hardly moves.
    const axisZ = (y: number) => -25 + (y + 72) * 0.43;
    const shares = (inside: (_point: Point) => boolean) =>
      skin.vertices.flatMap((p, i) => (inside(p) ? [turn(i)] : []));
    const trapezius = shares(
      ([x, y, z]) =>
        Math.abs(x) > 35 &&
        Math.abs(x) < 55 &&
        y < -100 &&
        y > -115 &&
        z < axisZ(y) - 20,
    );
    expect(trapezius.length).toBeGreaterThan(20);
    expect(Math.min(...trapezius)).toBeGreaterThan(0.02);
    expect(Math.max(...trapezius)).toBeLessThan(0.08);
    // The back of the neck at its base: about 5 mm at a 45 degree turn.
    const base = shares(
      ([x, y, z]) =>
        Math.abs(x) < 15 && y < -95 && y > -110 && z < axisZ(y) - 20,
    );
    expect(Math.max(...base)).toBeLessThan(0.12);
  });
});
