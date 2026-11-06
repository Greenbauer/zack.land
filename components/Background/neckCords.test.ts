import { describe, expect, it } from 'vitest';

import { expressions, meshes, Point, skin } from './headFixture';
import { BODY_SHARE } from './headTurn';
import { FAR_TURN, FULL_TURN } from './neckPose';

// The cords the neck's muscles make as the head turns (scripts/head/
// neckCords.mjs, added to bodyShapes.mjs's turn shapes), checked on the
// built head.

const moves = (name: string) => {
  const { indices, moves: sparse } =
    meshes.get('skin')!.morphs[expressions.indexOf(name)]!;
  const d = skin.vertices.map((): Point => [0, 0, 0]);
  indices.forEach((v, k) => {
    d[v] = [sparse[k * 3]!, sparse[k * 3 + 1]!, sparse[k * 3 + 2]!];
  });
  return d;
};

describe("the neck's cords as the head turns", () => {
  it('tightens the far neck muscle into a straight cord as the head turns', () => {
    // Turned to its left, the head's right sternocleidomastoid stands out
    // from behind the ear to beside the notch at the base of the throat, as
    // in photos of real necks (scripts/head/neckCords.mjs SCM), and runs
    // straight between them in the turned pose, as a tight muscle does (laid
    // out at rest and then turned, it curved up under the jaw like a C). The
    // left one, drawn out, shows far less.
    const axisZ = (y: number) => -25 + (y + 72) * 0.43;
    const { turnWeights } = meshes.get('skin')!;
    const outward = (d: Point[], i: number) => {
      const [x, y, z] = skin.vertices[i]!;
      const r = Math.hypot(x, z - axisZ(y));
      return (d[i]![0]! * x + d[i]![2]! * (z - axisZ(y))) / r;
    };
    // Where the neck's full turn (neckPose.ts FULL_TURN less the body's
    // share, about headTurn.ts PIVOT) carries vertex i, turning by `sign`
    // toward +x.
    const turned = (i: number, sign: number): Point => {
      const [x, y, z] = skin.vertices[i]!;
      const a = (sign * 0.79 * (1 - BODY_SHARE.turn) * turnWeights[i]!) / 255;
      return [
        x * Math.cos(a) + (z + 22) * Math.sin(a),
        y,
        -x * Math.sin(a) + (z + 22) * Math.cos(a) - 22,
      ];
    };
    for (const [name, side] of [
      ['neckTurnLeft', -1],
      ['neckTurnRight', 1],
    ] as const) {
      const d = moves(name);
      // The far side's most raised skin at height y.
      const highest = (y: number) => {
        let best = -1;
        skin.vertices.forEach(([x, vy], i) => {
          if (Math.sign(x) !== side || Math.abs(vy - y) > 1.5) return;
          if (best < 0 || outward(d, i) > outward(d, best)) best = i;
        });
        return best;
      };
      // Toward the ear it rises gradually into the side of the neck, never
      // more than 1.3 units each 6 down (ending over 16 units, it rose 2 and
      // stood out as a knob).
      const rises = [-44, -50, -56, -62, -68, -74, -80, -86, -92, -98].map(
        (y) => outward(d, highest(y)),
      );
      rises
        .slice(1)
        .forEach((rise, k) => expect(rise - rises[k]!).toBeLessThan(1.3));
      // The cord's crest at each height: the middle of the skin raised to
      // within 80% of the highest there, turned with the head (down to the
      // lowest third, where it fades into its tendon).
      const crest = [-66, -74, -82, -90].map((y) => {
        const best = highest(y);
        const peak = outward(d, best);
        expect(peak).toBeGreaterThan(2.5);
        // The same place on the near side, drawn out, rises far less.
        const [x, vy, z] = skin.vertices[best]!;
        const mirror = skin.vertices.flatMap(([mx, my, mz], i) =>
          Math.hypot(mx + x, my - vy, mz - z) < 2 ? [i] : [],
        );
        expect(mirror.length).toBeGreaterThan(0);
        for (const i of mirror)
          expect(Math.abs(outward(d, i))).toBeLessThan(0.5 * peak);
        const strip = skin.vertices.flatMap(([sx, sy], i) =>
          Math.sign(sx) === side &&
          Math.abs(sy - y) < 1.5 &&
          outward(d, i) > 0.8 * peak
            ? [i]
            : [],
        );
        return [0, 1, 2].map(
          (k) =>
            strip.reduce((sum, i) => sum + turned(i, -side)[k]!, 0) /
            strip.length,
        ) as Point;
      });
      // Straight: every crest within 2.5 units of the line between the
      // first and last, seen from the front (x) and the side (z).
      const [top, bottom] = [crest[0]!, crest[crest.length - 1]!];
      for (const p of crest) {
        const t = (p[1] - top[1]) / (bottom[1] - top[1]);
        for (const k of [0, 2])
          expect(
            Math.abs(p[k]! - (top[k]! + (bottom[k]! - top[k]!) * t)),
          ).toBeLessThan(2.5);
      }
    }
  });

  it("keeps the Adam's apple as prominent turned as at rest", () => {
    // Seen from the side, how far the apple stands out of the outline above
    // it (throatFill.mjs): turned, within 0.5 units of how far at rest (the
    // skin under the chin turning away with the jaw left a hollow over it,
    // and it stood out twice as far as at rest).
    const { turnWeights } = meshes.get('skin')!;
    const stands = (
      name: string | null,
      near: number,
      far: number,
      angle: number,
    ) => {
      const d = name ? moves(name) : null;
      const f = name ? moves(`${name}Far`) : null;
      const front = (y: number) =>
        Math.max(
          ...skin.vertices.flatMap(([x, vy, z], i) => {
            if (Math.abs(vy - y) > 1.2 || Math.abs(x) > 40) return [];
            const px = x + (d ? near * d[i]![0]! + far * f![i]![0]! : 0);
            const pz = z + (d ? near * d[i]![2]! + far * f![i]![2]! : 0);
            const a = (angle * turnWeights[i]!) / 255;
            return [-px * Math.sin(a) + (pz + 22) * Math.cos(a) - 22];
          }),
        );
      const apple = Math.max(...[-84, -86, -88, -90, -92].map(front));
      return apple - Math.min(...[-76, -78, -80, -82].map(front));
    };
    const rest = stands(null, 0, 0, 0);
    for (const degrees of [35, 47, 56])
      for (const [name, sign] of [
        ['neckTurnLeft', 1],
        ['neckTurnRight', -1],
      ] as const) {
        const head = (degrees * Math.PI) / 180;
        const far = Math.min(
          Math.max((head - FULL_TURN) / (FAR_TURN - FULL_TURN), 0),
          1,
        );
        const share = Math.min(head / FULL_TURN, 1);
        const neck = sign * head * (1 - BODY_SHARE.turn);
        expect(stands(name, share, far, neck)).toBeLessThan(rest + 0.5);
      }
  });

  it('runs the base of the throat into the notch turned far, not out', () => {
    // Turned as far as it goes, seen from the side, the base of the throat
    // stands at most 3 units in front of the notch below it (2.3 with the
    // tight cord left off: the twist and the scanned shapes): the cord's
    // end, full down to just above the notch, stood it out 5.3, then in at
    // the notch, then out again at the chest.
    const { turnWeights } = meshes.get('skin')!;
    const angle = FAR_TURN * (1 - BODY_SHARE.turn);
    for (const [name, sign] of [
      ['neckTurnLeft', 1],
      ['neckTurnRight', -1],
    ] as const) {
      const [near, far] = [moves(name), moves(`${name}Far`)];
      const front = (y: number) =>
        Math.max(
          ...skin.vertices.flatMap(([x, vy, z], i) => {
            if (Math.abs(vy - y) > 1.5) return [];
            const [px, pz] = [
              x + near[i]![0]! + far[i]![0]!,
              z + near[i]![2]! + far[i]![2]!,
            ];
            const a = (sign * angle * turnWeights[i]!) / 255;
            return [-px * Math.sin(a) + (pz + 22) * Math.cos(a) - 22];
          }),
        );
      expect(front(-116) - front(-128)).toBeLessThan(3);
    }
  });

  it('draws out the near neck muscle into a band at the far turn, no ripples', () => {
    // Turned as far as it goes (neckPose.ts FAR_TURN: both turn shapes full),
    // the muscle on the side the head turns toward stands out too, as in a
    // photo of the subject turned 70 degrees (neckCords.mjs SCM taut), less
    // than the tight one, and evenly: unevened it rippled above the collarbone.
    const axisZ = (y: number) => -25 + (y + 72) * 0.43;
    const outward = (d: Point[], i: number) => {
      const [x, y, z] = skin.vertices[i]!;
      const r = Math.hypot(x, z - axisZ(y));
      return (d[i]![0]! * x + d[i]![2]! * (z - axisZ(y))) / r;
    };
    for (const [name, toward] of [
      ['neckTurnLeft', 1],
      ['neckTurnRight', -1],
    ] as const) {
      const [near, far] = [moves(name), moves(`${name}Far`)];
      const d = near.map((m, i) => m.map((c, a) => c + far[i]![a]!) as Point);
      const most = (side: number, y: number) =>
        Math.max(
          ...skin.vertices.flatMap(([x, vy], i) =>
            Math.sign(x) === side && Math.abs(vy - y) < 1.5
              ? [outward(d, i)]
              : [],
          ),
        );
      for (const y of [-74, -82, -90]) {
        expect(most(toward, y)).toBeGreaterThan(1.5);
        expect(most(toward, y)).toBeLessThan(most(-toward, y));
      }
      // Evenly: no point down the drawn-out side stands out from or sinks
      // below the average of its neighbours by a fifth of a unit (rippled
      // above the collarbone, they did by more than a third).
      const around = skin.vertices.map(() => new Set<number>());
      skin.faces.forEach((f) =>
        f.forEach((a, k) => {
          const b = f[(k + 1) % f.length]!;
          around[a]!.add(b);
          around[b]!.add(a);
        }),
      );
      skin.vertices.forEach(([x, y], i) => {
        if (toward * x < 10 || y > -60 || y < -130) return;
        const others = [...around[i]!];
        const mean =
          others.reduce((sum, j) => sum + outward(d, j), 0) / others.length;
        expect(Math.abs(outward(d, i) - mean)).toBeLessThan(0.2);
      });
      // Nor steps across the middle of the throat (the tight cord cut off
      // there, its neighbours across it differed by 3.4).
      skin.faces.forEach((f) =>
        f.forEach((a, k) => {
          const b = f[(k + 1) % f.length]!;
          const [pa, pb] = [skin.vertices[a]!, skin.vertices[b]!];
          if (pa[0] * pb[0] >= 0 || pa[1] < -130 || pa[1] > -100) return;
          expect(Math.abs(outward(d, a) - outward(d, b))).toBeLessThan(1);
        }),
      );
    }
  });
});
