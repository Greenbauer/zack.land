import type { Head } from './headGeometry';

// One-sided versions of some of the head's expressions, made when it loads:
// head.bin's expressions move both sides of the face together, so a single
// raised brow or one squinting eye (ambient.ts) needs each split in two.
// Each half keeps the moves on its side of the face's middle, blending
// smoothly across it, so the two halves add up to the whole expression.
// They are named after the expression and the side, from the head's own
// point of view: browsUpLeft lifts its left brow (the viewer's right).

export const SIDED = [
  'browsUp',
  'squint',
  // For the one-sided expressions (oneSided.ts).
  'blink',
  'blinkTight',
  'smile',
  'sneer',
  'dimple',
  'press',
  'browDown',
  'browOuterUp',
  'shrug',
] as const;
export const SIDES = ['Left', 'Right'] as const;
export type Side = (typeof SIDES)[number];

// The face's middle across, in head.bin units (between the eyes: MyHead's
// EYES), and how far either side of it the halves blend: about a centimetre,
// as the face's own moves fade across it (blended over less, a one-sided
// expression shows a seam down the forehead), and across the whole neck for
// the shoulders'.
const MIDDLE = -0.7;
const BLEND = 6;
const WIDE_BLEND = 22;
const WIDE = new Set(['shrug']);

// How much of a move at `x` belongs to `side`'s half (of expression `name`).
// The head faces +z, so its own left is +x.
export function sideWeight(x: number, side: Side, name = '') {
  const blend = WIDE.has(name) ? WIDE_BLEND : BLEND;
  const t = Math.min(Math.max((x - MIDDLE + blend) / (2 * blend), 0), 1);
  const left = t * t * (3 - 2 * t);
  return side === 'Left' ? left : 1 - left;
}

// `head` with the one-sided halves of `names` (those it has) added after
// its own expressions.
export function withSides(
  { meshes, expressions }: Head,
  names: readonly string[] = SIDED,
): Head {
  const split = names
    .filter((name) => expressions.includes(name))
    .flatMap((name) => SIDES.map((side) => ({ name, side })));
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
                    name,
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
