import { describe, expect, it } from 'vitest';

import { expressions, openEdges, Point, skin, skinMoves } from './headFixture';

// The bust's own moves (scripts/head/bodyShapes.mjs), which move the
// shoulders and chest on purpose.
const BODY = ['shrug', 'breathe', 'swallow'];
// The neck's shapes (MHR's scanned pose correctives, scripts/head/mhr.mjs)
// carry on a little into the top of the shoulders, as a real neck's
// muscles do: by at most this much (units, about 1.7 mm each).
const NECK = [
  'neckTurnLeft',
  'neckTurnRight',
  'neckTurnLeftFar',
  'neckTurnRightFar',
  'neckUp',
  'neckDown',
];
const NECK_INTO_SHOULDERS = 2.5;

describe('the head joined to its neck and shoulders', () => {
  describe('expressions', () => {
    // Each expression's move of every skin point at full strength.
    const moves = skinMoves;
    // The average move of the skin near (x, y), on the front of the face.
    const near = (d: Point[], x: number, y: number, r = 1.5) => {
      const at = skin.vertices.flatMap(([vx, vy, vz], i) =>
        Math.abs(vx - x) < r && Math.abs(vy - y) < r && vz > 25 ? [i] : [],
      );
      return [0, 1, 2].map(
        (a) => at.reduce((sum, i) => sum + d[i]![a]!, 0) / at.length,
      );
    };
    // A triangle's area; slivers (under SLIVER) are left out of the fold
    // check, since any move turns them, as are the triangles on the bust's
    // cut edges (`cut`), which the page fades out.
    const SLIVER = 0.05;
    const cut = new Set(
      openEdges().flatMap((key) => key.split(',').map(Number)),
    );
    const area = (p: Point[], f: number[]) => {
      const [a, b, c] = f.map((i) => p[i]!) as [Point, Point, Point];
      const u = b.map((v, k) => v - a[k]!);
      const w = c.map((v, k) => v - a[k]!);
      return (
        Math.hypot(
          u[1]! * w[2]! - u[2]! * w[1]!,
          u[2]! * w[0]! - u[0]! * w[2]!,
          u[0]! * w[1]! - u[1]! * w[0]!,
        ) / 2
      );
    };
    // Where the closed lids meet at the inner corner of the eye, a triangle
    // or two (well under a square millimetre) turns past edge-on, too small
    // to see; the blinks' fold check leaves them out.
    const innerCorner = (f: number[]) =>
      f.every(
        (i) =>
          Math.abs(Math.abs(skin.vertices[i]![0]) - 11.8) < 1.5 &&
          Math.abs(skin.vertices[i]![1] - 2.4) < 1.5,
      );
    const unit = (p: Point[], f: number[]) => {
      const [a, b, c] = f.map((i) => p[i]!) as [Point, Point, Point];
      const u = b.map((v, k) => v - a[k]!);
      const w = c.map((v, k) => v - a[k]!);
      const n = [
        u[1]! * w[2]! - u[2]! * w[1]!,
        u[2]! * w[0]! - u[0]! * w[2]!,
        u[0]! * w[1]! - u[1]! * w[0]!,
      ];
      const l = Math.hypot(...n) || 1;
      return n.map((c) => c / l);
    };

    it('has a smile, a wide-eyed look, a gasp, a pout, brows up, a squint and a worried look', () => {
      expect(expressions.slice(0, 7)).toEqual([
        'smile',
        'wide',
        'gasp',
        'pout',
        'browsUp',
        'squint',
        'worried',
      ]);
    });

    it('draws the inner brows up for the worried look and turns the mouth corners down', () => {
      const d = moves('worried');
      for (const side of [-1, 1]) {
        // The inner brows rise, well past the outer ends, and draw in.
        const inner = near(d, side * 6, 12.5);
        expect(inner[1]).toBeGreaterThan(1.5);
        expect(inner[1]).toBeGreaterThan(near(d, side * 28, 12.5)[1]! + 1.5);
        expect(inner[0]! * side).toBeLessThan(0);
      }
      // The mouth's corners (as the smile's test finds them) go down.
      expect(near(d, -14, -38.5, 2)[1]).toBeLessThan(-0.8);
      expect(near(d, 12, -38.2, 2)[1]).toBeLessThan(-0.8);
    });

    it('lifts the brows for brows up and leaves the mouth still', () => {
      const d = moves('browsUp');
      expect(near(d, 8, 12.5)[1]).toBeGreaterThan(1.5);
      expect(near(d, -8, 12.5)[1]).toBeGreaterThan(1.5);
      expect(Math.hypot(...near(d, 0, -39, 1.2))).toBeLessThan(0.1);
    });

    it('narrows the eyes for the squint and leaves the mouth still', () => {
      const d = moves('squint');
      // The lower lids rise; the inner brows come down.
      expect(near(d, 18, -2, 1.5)[1]).toBeGreaterThan(0.5);
      expect(near(d, -18, -2, 1.5)[1]).toBeGreaterThan(0.5);
      expect(near(d, 8, 12.5)[1]).toBeLessThan(-0.5);
      expect(Math.hypot(...near(d, 0, -39, 1.2))).toBeLessThan(0.1);
    });

    it('never folds the skin over, nor moves the shoulders but in the body moves', () => {
      // The triangles checked, with their resting normals, worked out once.
      const checked = skin.faces
        .filter(
          (f) => area(skin.vertices, f) >= SLIVER && !f.some((i) => cut.has(i)),
        )
        .map((f) => ({
          f,
          rest: unit(skin.vertices, f),
          corner: innerCorner(f),
        }));
      for (const name of expressions) {
        const d = moves(name);
        const posed = skin.vertices.map(
          (v, i) => v.map((c, a) => c + d[i]![a]!) as Point,
        );
        let least = 1;
        for (const { f, rest: a, corner } of checked) {
          if (name.startsWith('blink') && corner) continue;
          const b = unit(posed, f);
          least = Math.min(
            least,
            a[0]! * b[0]! + a[1]! * b[1]! + a[2]! * b[2]!,
          );
        }
        // The first seven turn no triangle past 78 degrees. The later ones
        // turn some further at the corners of the eyes and of a wide-open
        // mouth, as skin does there, and fold none over.
        expect(least).toBeGreaterThan(expressions.indexOf(name) < 7 ? 0.2 : 0);
        if (BODY.includes(name)) continue;
        const limit = NECK.includes(name) ? NECK_INTO_SHOULDERS : 0.01;
        skin.vertices.forEach(([x, y], i) => {
          if (Math.abs(x) > 70 || y < -140)
            expect(Math.hypot(...d[i]!)).toBeLessThan(limit);
        });
      }
    }, 30_000); // Every triangle of every expression: slow on a busy machine.

    it('smiles wide, the way the reference grin does', () => {
      // The corners go out and up, and the lips part a little in the middle
      // (narrowly: not wide open).
      const d = moves('smile');
      const [left, right] = [near(d, -14, -38.5, 2), near(d, 12, -38.2, 2)];
      expect(left[0]).toBeLessThan(-2.5);
      expect(right[0]).toBeGreaterThan(2.5);
      expect(left[1]).toBeGreaterThan(2);
      const parting = near(d, 0, -37.5, 1.2)[1]! - near(d, 0, -39, 1.2)[1]!;
      expect(parting).toBeGreaterThan(0.5);
      expect(parting).toBeLessThan(1.6);
    });

    it('opens the eyes and lifts the brows for the wide-eyed look, mouth shut', () => {
      const d = moves('wide');
      expect(near(d, 8, 12.5)[1]).toBeGreaterThan(2.5);
      expect(near(d, -8, 12.5)[1]).toBeGreaterThan(2.5);
      expect(
        Math.abs(near(d, 0, -39, 1.2)[1]! - near(d, 0, -37.5, 1.2)[1]!),
      ).toBeLessThan(0.3);
    });

    it('drops the jaw for the gasp and carries it smoothly down the throat', () => {
      const d = moves('gasp');
      expect(near(d, 0, -58)[1]).toBeLessThan(-8);
      // Across any edge of the neck the move changes by less than the edge
      // is long: the throat stretches, it does not crease.
      let worst = 0;
      for (const f of skin.faces)
        f.forEach((a, k) => {
          const b = f[(k + 1) % 3]!;
          const [pa, pb] = [skin.vertices[a]!, skin.vertices[b]!];
          if (pa[1] > -66 || pa[1] < -130) return;
          const edge = Math.hypot(...pa.map((c, x) => c - pb[x]!));
          const change = Math.hypot(...d[a]!.map((c, x) => c - d[b]![x]!));
          worst = Math.max(worst, change / edge);
        });
      expect(worst).toBeLessThan(1.2);
    });

    it('pushes the lips out and draws the inner brows down for the pout', () => {
      const d = moves('pout');
      expect(near(d, 0, -39, 1.2)[2]).toBeGreaterThan(2.5);
      expect(near(d, 8, 12.5)[1]).toBeLessThan(-1);
      expect(near(d, 0, -58)[1]).toBeGreaterThan(1);
    });
  });
});
