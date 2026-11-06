import { describe, expect, it } from 'vitest';

import {
  expressions,
  joinY,
  meshes,
  openEdges,
  Point,
  skin,
} from './headFixture';
import { BODY_SHARE } from './headTurn';

// The rig's own moves beyond the page's first seven (scripts/head/
// faceShapes.mjs, mouthShapes.mjs, bodyShapes.mjs), checked on the built head.

const moves = (name: string) => {
  const { indices, moves: sparse } =
    meshes.get('skin')!.morphs[expressions.indexOf(name)]!;
  const d = skin.vertices.map((): Point => [0, 0, 0]);
  indices.forEach((v, k) => {
    d[v] = [sparse[k * 3]!, sparse[k * 3 + 1]!, sparse[k * 3 + 2]!];
  });
  return d;
};
// The average move of the skin near (x, y), on the front of the face.
const near = (d: Point[], x: number, y: number, r = 1.5, front = 25) => {
  const at = skin.vertices.flatMap(([vx, vy, vz], i) =>
    Math.abs(vx - x) < r && Math.abs(vy - y) < r && vz > front ? [i] : [],
  );
  return [0, 1, 2].map(
    (a) => at.reduce((sum, i) => sum + d[i]![a]!, 0) / at.length,
  );
};
const size = (p: number[]) => Math.hypot(...p);
// Each eyeball's centre and radius.
const eyeballs = ['leftEye', 'rightEye'].map((name) => {
  const { positions } = meshes.get(name)!;
  const points = Array.from(
    { length: positions.length / 3 },
    (_, i) => [...positions.subarray(i * 3, i * 3 + 3)] as Point,
  );
  const centre = [0, 1, 2].map(
    (a) =>
      (Math.min(...points.map((p) => p[a]!)) +
        Math.max(...points.map((p) => p[a]!))) /
      2,
  ) as Point;
  const radius = Math.max(
    ...points.map((p) => size(p.map((c, a) => c - centre[a]!))),
  );
  return { centre, radius };
});

describe("the head's further expressions", () => {
  it('follows the first seven with the eyes, brows, nose, mouth, jaw and body', () => {
    expect(expressions.slice(7)).toEqual([
      'blink',
      'browDown',
      'browInnerUp',
      'browOuterUp',
      'noseFlare',
      'sneer',
      'blinkTight',
      'jawOpen',
      'mouthO',
      'mouthU',
      'pucker',
      'lipStretch',
      'press',
      'lowerLipIn',
      'frown',
      'dimple',
      'mouthLeft',
      'mouthRight',
      'jawLeft',
      'jawRight',
      'jawForward',
      'cheekPuff',
      'cheekSuck',
      'shrug',
      'breathe',
      'swallow',
      'neckTurnLeft',
      'neckTurnRight',
      'neckTurnLeftFar',
      'neckTurnRightFar',
      'neckUp',
      'neckDown',
    ]);
  });

  it('closes the eyes for the blink, the lids never sinking into the eyeballs', () => {
    const d = moves('blink');
    for (const { centre } of eyeballs) {
      // The upper lid comes most of the way down; the lower rises a little.
      expect(near(d, centre[0], 4.6, 1.2, 30)[1]).toBeLessThan(-2.5);
      expect(near(d, centre[0], -0.2, 1.2, 30)[1]).toBeGreaterThan(0.2);
    }
    // At every strength on the way, no skin over an eye is inside it.
    for (const strength of [0.25, 0.5, 0.75, 1])
      skin.vertices.forEach((v, i) => {
        if (size(d[i]!) < 0.05) return;
        for (const { centre, radius } of eyeballs) {
          const p = v.map((c, a) => c + strength * d[i]![a]! - centre[a]!);
          // (The lid corners rest a little inside the eyeball's sphere,
          // tucked against it; none sinks further in.)
          const rest = size(v.map((c, a) => c - centre[a]!));
          if (p[2]! > 2)
            expect(size(p)).toBeGreaterThan(Math.min(rest, radius) - 0.05);
        }
      });
  });

  it('moves only the mouth for the speech shapes, leaving the eyes still', () => {
    for (const name of ['jawOpen', 'mouthO', 'pucker', 'lipStretch', 'press'])
      expect(size(near(moves(name), 16, 3, 3))).toBeLessThan(0.05);
  });

  it('rounds the lips forward for "oh", "oo" and the kiss, corners drawn in', () => {
    for (const name of ['mouthO', 'mouthU', 'pucker']) {
      const d = moves(name);
      // (Measured at the upper lip's front: the line where the lips meet is
      // set back between them, below.)
      expect(near(d, -1, -35, 1.5)[2]).toBeGreaterThan(2.5);
      // Drawn in, though the kiss keeps most of the mouth's width (as real
      // ones do).
      expect(near(d, -14, -38.9, 1.5)[0]).toBeGreaterThan(1.5);
      expect(near(d, 12, -38.2, 1.5)[0]).toBeLessThan(-1.5);
    }
    // "Oh" opens; "oo" all but closes.
    // The gap between the lip edges mid-mouth (the skin's open edge there).
    const opening = (name: string) => {
      const d = moves(name);
      const edge = new Set(
        openEdges().flatMap((key) => key.split(',').map(Number)),
      );
      const mid = skin.vertices.flatMap(([x, y, z], i) =>
        edge.has(i) && Math.abs(x + 1) < 1.5 && z > 35 && y > -42 && y < -34
          ? [i]
          : [],
      );
      const height = (upper: boolean) => {
        const lip = mid.filter((i) => skin.vertices[i]![1] > -37.75 === upper);
        return (
          lip.reduce((sum, i) => sum + skin.vertices[i]![1] + d[i]![1]!, 0) /
          lip.length
        );
      };
      return height(true) - height(false);
    };
    expect(opening('mouthO')).toBeGreaterThan(5);
    expect(opening('mouthU')).toBeGreaterThan(3);
    expect(opening('mouthU')).toBeLessThan(opening('mouthO'));
    // The kiss is sealed: the lips meet.
    expect(opening('pucker')).toBeLessThan(0.3);
  });

  it('shapes the kiss in profile as two rounded lips, not a beak', () => {
    // The face's outline from the side across the mouth's middle: the
    // front-most moved skin at each height.
    const d = moves('pucker');
    const outline = (y: number) =>
      Math.max(
        ...skin.vertices.flatMap((v, i) => {
          const q = v.map((c, a) => c + d[i]![a]!);
          return Math.abs(q[0]! + 1) < 1.2 && Math.abs(q[1]! - y) < 0.5
            ? [q[2]!]
            : [];
        }),
      );
    const heights = Array.from({ length: 41 }, (_, k) => -30 - k * 0.5);
    const z = heights.map(outline);
    // The line where the lips meet: the outline's deepest point across them.
    const seamAt = heights.reduce(
      (best, y, k) => (y < -36 && y > -41 && z[k]! < z[best]! ? k : best),
      heights.indexOf(-38),
    );
    const upper = Math.max(...z.slice(0, seamAt));
    const lower = Math.max(...z.slice(seamAt, seamAt + 16));
    // Each lip its own mound, the line where they meet set back between
    // them: pushed forward together they met at their fronts in a point
    // (set back 0.1 to 0.3 units); set back over 2.5, blind reviewers saw a
    // deep groove splitting two thin rolls.
    const setBack = Math.min(upper, lower) - z[seamAt]!;
    expect(setBack).toBeGreaterThan(0.6);
    expect(setBack).toBeLessThan(2.5);
  });

  it("shapes the neck for a turn as MHR's scans do, the same either way", () => {
    // MHR's pose correctives (scripts/head/mhr.mjs): turned left or right,
    // the lower neck changes shape by a unit or two (the top half, by the
    // jaw, is left to the turn), and the left turn is the
    // right one mirrored, within about a tenth of that (our scanned head is
    // not quite symmetrical; MHR's neck placed on it a little off centre
    // would show here as a larger mismatch).
    const [left, right] = [moves('neckTurnLeft'), moves('neckTurnRight')];
    const largest = Math.max(...left.map(size));
    expect(largest).toBeGreaterThan(1);
    expect(largest).toBeLessThan(8);
    const at = new Map(
      skin.vertices.map((p, i) => [p.map(Math.round).join(), i] as const),
    );
    let total = 0;
    let count = 0;
    skin.vertices.forEach(([x, y, z], i) => {
      if (y > -60 || y < -130) return;
      const j = at.get([-x, y, z].map(Math.round).join());
      if (j === undefined) return;
      const [l, r] = [left[i]!, right[j]!];
      total += Math.hypot(l[0] + r[0], l[1] - r[1], l[2] - r[2]);
      count++;
    });
    expect(count).toBeGreaterThan(500);
    expect(total / count).toBeLessThan(0.4);
  });

  it('rolls the skin where the chin meets the throat forward as the head looks down', () => {
    // A chin tuck bunches the soft skin under the jaw down and out
    // (scripts/head/bodyShapes.mjs CHIN_TUCK). Without it, looking down
    // swung the chin's underside back into the throat and folded it into a
    // sharp notch, the top of the throat standing up into a point.
    const d = moves('neckDown');
    const crease = skin.vertices.flatMap(([x, y, z], i) =>
      Math.abs(x) < 5 && Math.abs(y - joinY(z)) < 3 && z > 0 ? [i] : [],
    );
    expect(crease.length).toBeGreaterThan(10);
    const average = (k: number) =>
      crease.reduce((sum, i) => sum + d[i]![k]!, 0) / crease.length;
    expect(average(2)).toBeGreaterThan(2);
    expect(average(1)).toBeLessThan(-1);
    // The chin's bone itself stays as it is.
    skin.vertices.forEach(([x, y, z], i) => {
      if (Math.abs(x) < 10 && z > 30 && y > -62 && y < -45)
        expect(size(d[i]!)).toBeLessThan(0.5);
    });
  });

  it('keeps the neck below the chin smooth as the head looks down', () => {
    // A real neck looking down, in a side photo, stays one smooth plane from
    // under the jaw to the shoulders. MHR's scanned shape for it stood the
    // muscles at the sides of the neck out in a ridge from under the ear and
    // bunched the throat into lumps, so the shape is the chin tuck and the
    // back of the neck's line, which both fade out above here.
    const d = moves('neckDown');
    skin.vertices.forEach(([, y], i) => {
      if (y < -90 && y > -120) expect(size(d[i]!)).toBeLessThan(0.3);
    });
  });

  it('runs the back of the neck in one even curve as the head looks down', () => {
    // A real neck looking down, in a side photo, runs from the skull to the
    // shoulders in one curve, leaning back steadily more (scripts/head/
    // napeLine.mjs). Bent by the shader alone, the skull tipped over an
    // upright nape and the back of the neck stood out as a column: leaning
    // back 24 degrees under the skull, straight down (8) below it, then 46
    // at a corner above the shoulders.
    const d = moves('neckDown');
    const { headWeights } = meshes.get('skin')!;
    const turnX = ([x, y, z]: Point, a: number, cy = 0, cz = 0): Point => [
      x,
      cy + (y - cy) * Math.cos(a) - (z - cz) * Math.sin(a),
      cz + (y - cy) * Math.sin(a) + (z - cz) * Math.cos(a),
    ];
    const step = (x: number, low: number, high: number) => {
      const t = Math.min(Math.max((x - low) / (high - low), 0), 1);
      return t * t * (3 - 2 * t);
    };
    // The neck nodded fully down (neckPose.ts FULL_NOD, less the body's
    // share) as headTurn.ts nods it: the skull's share (TUCK) at its joint
    // (PIVOT), the rest an even bend down the neck from NECK_BASE.
    const [nod, tuck] = [0.52 * (1 - BODY_SHARE.nod), 0.6];
    const [ay, az] = [92, 23.6].map((c) => c / Math.hypot(92, 23.6)) as [
      number,
      number,
    ];
    const length = Math.hypot(92, 23.6);
    const posed = skin.vertices.map((rest, i) => {
      const w = headWeights[i]! / 255;
      const p = rest.map((c, k) => c + d[i]![k]!) as Point;
      const nape = step(rest[2], 5, -50) * (1 - step(rest[1], -50, -28));
      const skull = nod * tuck * w * step(rest[1], -95, -52) * (1 - nape);
      const t = turnX(p, skull, -28, -22);
      const [a, total] = [nod * (1 - tuck) * w, nod * (1 - tuck)];
      const s = w * length;
      const [along, aside] = [
        (Math.sin(a) * length) / total,
        ((1 - Math.cos(a)) * length) / total,
      ];
      const r = turnX([t[0], t[1] + 120 - ay * s, t[2] + 45.6 - az * s], a);
      return [
        r[0],
        -120 + ay * along - az * aside + r[1],
        -45.6 + az * along + ay * aside + r[2],
      ] as Point;
    });
    // The farthest back the skin reaches at height y, near the midline.
    const back = (y: number) => {
      let z = Infinity;
      for (const face of skin.faces) {
        if (face.some((i) => Math.abs(posed[i]![0]) > 30)) continue;
        for (let e = 0; e < 3; e++) {
          const p = posed[face[e]!]!;
          const q = posed[face[(e + 1) % 3]!]!;
          if ((p[1] - y) * (q[1] - y) > 0 || p[1] === q[1]) continue;
          z = Math.min(z, p[2] + ((y - p[1]) / (q[1] - p[1])) * (q[2] - p[2]));
        }
      }
      return z;
    };
    const heights = Array.from({ length: 25 }, (_, k) => -14 - k * 3);
    const zs = heights.map(back);
    // Its lean over each 6 units (over 3, the mesh's facets low on the
    // neck jitter it by 15 degrees).
    const lean = zs
      .slice(2)
      .map((z, k) => (Math.atan2(zs[k]! - z, 6) * 180) / Math.PI);
    // Never turning back toward upright by more than 4 degrees.
    lean.forEach((l, k) =>
      expect(l).toBeGreaterThan(Math.max(...lean.slice(0, k + 1)) - 4),
    );
    expect(lean.at(-1)! - lean[0]!).toBeGreaterThan(12);
  });

  it('raises the shoulders for the shrug and leaves the head still', () => {
    const d = moves('shrug');
    const shoulder = skin.vertices.flatMap(([x, y], i) =>
      Math.abs(x) > 90 && Math.abs(x) < 110 && y > -135 && y < -110 ? [i] : [],
    );
    for (const i of shoulder) expect(d[i]![1]).toBeGreaterThan(12);
    for (const name of ['shrug', 'breathe', 'swallow']) {
      const body = moves(name);
      skin.vertices.forEach(([, y], i) => {
        if (y > -40) expect(size(body[i]!)).toBeLessThan(0.01);
      });
    }
  });
});
