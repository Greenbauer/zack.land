import { describe, expect, it } from 'vitest';

import { SKULL_PIVOT } from '../../components/Background/headTurn';

// The helpers the head build scripts share (falloff.mjs, mesh.mjs,
// neckAxis.mjs). They are plain JavaScript that tsc would check if imported
// here, and it cannot (neckAxis.mjs imports a .ts file, as Node allows), so
// they load untyped and are typed below.
type Vec = number[];
type Fn<Args extends unknown[], Result> = (..._args: Args) => Result;
const script = (name: string) => import(/* @vite-ignore */ `./${name}.mjs`);
const { bump, smoothstep } = (await script('falloff')) as {
  bump: Fn<[number, number], number>;
  smoothstep: Fn<[number, number, number], number>;
};
const { cross, dot, edgeNeighbours, length, minus } = (await script(
  'mesh',
)) as {
  cross: Fn<[Vec, Vec], Vec>;
  dot: Fn<[Vec, Vec], number>;
  edgeNeighbours: Fn<[{ vertices: Vec[]; faces: Vec[] }], Set<number>[]>;
  length: Fn<[Vec], number>;
  minus: Fn<[Vec, Vec], Vec>;
};
const { around, axisZ, radial, twisted } = (await script('neckAxis')) as {
  around: Fn<[Vec], number>;
  axisZ: Fn<[number], number>;
  radial: Fn<[Vec], Vec>;
  twisted: Fn<[Vec, number], Vec>;
};

describe('smoothstep', () => {
  it('holds at 0 and 1 outside its range and eases between', () => {
    expect(smoothstep(-5, 0, 10)).toBe(0);
    expect(smoothstep(0, 0, 10)).toBe(0);
    expect(smoothstep(10, 0, 10)).toBe(1);
    expect(smoothstep(25, 0, 10)).toBe(1);
    expect(smoothstep(5, 0, 10)).toBe(0.5);
    // Flat at both ends: a tenth of the way in it has risen under a tenth.
    expect(smoothstep(1, 0, 10)).toBeCloseTo(0.028);
    expect(smoothstep(9, 0, 10)).toBeCloseTo(0.972);
  });

  it('runs the other way when low is above high', () => {
    // As the build uses it for heights going down (bodyShapes.mjs).
    expect(smoothstep(-70, -70, -125)).toBe(0);
    expect(smoothstep(-125, -70, -125)).toBe(1);
    expect(smoothstep(-90, -70, -125)).toBeLessThan(
      smoothstep(-110, -70, -125),
    );
  });
});

describe('bump', () => {
  it('is 1 at its centre, even, and falls to 1/e at its width', () => {
    expect(bump(0, 4)).toBe(1);
    expect(bump(3, 4)).toBe(bump(-3, 4));
    expect(bump(4, 4)).toBeCloseTo(Math.exp(-1));
    expect(bump(40, 4)).toBeLessThan(1e-40);
  });
});

describe('vector helpers', () => {
  it('subtracts, measures and multiplies 3D vectors', () => {
    expect(minus([5, 7, 9], [1, 2, 3])).toEqual([4, 5, 6]);
    expect(length([3, 4, 12])).toBe(13);
    expect(dot([1, 2, 3], [4, -5, 6])).toBe(12);
    expect(cross([1, 0, 0], [0, 1, 0])).toEqual([0, 0, 1]);
    expect(cross([0, 1, 0], [1, 0, 0])).toEqual([0, 0, -1]);
    // At right angles to both.
    const n = cross([1, 2, 3], [-2, 0, 5]);
    expect(dot(n, [1, 2, 3])).toBe(0);
    expect(dot(n, [-2, 0, 5])).toBe(0);
  });
});

describe('edgeNeighbours', () => {
  it('joins each vertex to those it shares an edge with, once each', () => {
    // A quad and a triangle sharing the edge 1-2; vertex 5 is on no face.
    const vertices = Array.from({ length: 6 }, () => [0, 0, 0]);
    const faces = [
      [0, 1, 2, 3],
      [1, 4, 2],
    ];
    const near = edgeNeighbours({ vertices, faces }).map((s) => [...s]);
    expect(near).toEqual([[1, 3], [0, 2, 4], [1, 3, 4], [2, 0], [1, 2], []]);
  });
});

describe("the neck's axis", () => {
  it('runs through the middle of the neck, leaning forward lower down', () => {
    expect(axisZ(-72)).toBe(-25);
    expect(axisZ(-120)).toBeCloseTo(-45.64);
    expect(axisZ(-40)).toBeGreaterThan(axisZ(-72));
  });

  it('measures where a point sits round it and the way out from it', () => {
    const y = -90;
    const front = [0, y, axisZ(y) + 10];
    const left = [10, y, axisZ(y)];
    expect(around(front)).toBe(0);
    expect(around(left)).toBeCloseTo(Math.PI / 2);
    expect(radial(front)).toEqual([0, 0, 1]);
    expect(radial(left)).toEqual([1, 0, 0]);
    const out = radial([3, y, axisZ(y) - 4]);
    expect(out[1]).toBe(0);
    expect(length(out)).toBeCloseTo(1);
    // On the axis itself it stays finite.
    expect(radial([0, y, axisZ(y)])).toEqual([0, 0, 0]);
  });

  it("twists about the vertical through the page's skull pivot", () => {
    const [, , pz] = SKULL_PIVOT;
    // Points on that vertical stay put; others swing round it.
    expect(twisted([0, -80, pz], 0.7)).toEqual([0, -80, pz]);
    const p = [4, -60, 9];
    expect(twisted(p, 0)).toEqual(p);
    const [x, y, z] = twisted([0, -60, pz + 10], Math.PI / 2);
    expect(x).toBeCloseTo(10);
    expect(y).toBe(-60);
    expect(z).toBeCloseTo(pz);
    // A turn keeps the distance from the vertical.
    const [qx, , qz] = twisted(p, 1.1) as [number, number, number];
    expect(Math.hypot(qx, qz - pz)).toBeCloseTo(Math.hypot(4, 9 - pz));
  });
});
