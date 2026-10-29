import type { Head } from './headGeometry';

// One-sided versions of some of the head's expressions, made when it loads:
// head.bin's expressions move both sides of the face together, so a single
// raised brow or one squinting eye (ambient.ts) needs each split in two.
// Each half keeps the moves on its side of the face's middle, blending
// smoothly across it, so the two halves add up to the whole expression.
// They are named after the expression and the side, from the head's own
// point of view: browsUpLeft lifts its left brow (the viewer's right).

export const SIDED = ['browsUp', 'squint'] as const;
export const SIDES = ['Left', 'Right'] as const;
export type Side = (typeof SIDES)[number];

// The face's middle across, in head.bin units (between the eyes: MyHead's
// EYES), and how far either side of it the halves blend.
const MIDDLE = -0.7;
const BLEND = 1.5;

// How much of a move at `x` belongs to `side`'s half. The head faces +z, so
// its own left is +x.
export function sideWeight(x: number, side: Side) {
  const t = Math.min(Math.max((x - MIDDLE + BLEND) / (2 * BLEND), 0), 1);
  const left = t * t * (3 - 2 * t);
  return side === 'Left' ? left : 1 - left;
}

// `head` with the one-sided expressions added after its own.
export function withSides({ meshes, expressions }: Head): Head {
  const split = SIDED.filter((name) => expressions.includes(name)).flatMap(
    (name) => SIDES.map((side) => ({ name, side })),
  );
  const sided = new Map(
    [...meshes].map(([mesh, part]) => [
      mesh,
      {
        ...part,
        morphs: [
          ...part.morphs,
          ...split.map(({ name, side }) => {
            const { indices, moves } = part.morphs[expressions.indexOf(name)]!;
            return {
              indices,
              moves: moves.map(
                (m, k) =>
                  m *
                  sideWeight(
                    part.positions[indices[Math.floor(k / 3)]! * 3]!,
                    side,
                  ),
              ),
            };
          }),
        ],
      },
    ]),
  );
  return {
    meshes: sided,
    expressions: [
      ...expressions,
      ...split.map(({ name, side }) => `${name}${side}`),
    ],
  };
}
