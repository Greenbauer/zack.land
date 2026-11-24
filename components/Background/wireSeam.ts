// The triangles the head's wireframe draws (StoryProps.tsx): the skin's own,
// but with the seam where the scanned head is joined to the body below it
// thinned out. There the head and the body were each cut by slicing their
// triangles, which left the cut edges crowded with points and slivers, so in
// the wireframe a dense line ran round the neck. Here the points along the
// seam closer together than SHORT of the skin's usual edge just above it are
// merged, two at a time, so the wireframe there has the spacing of the rest.
// Only the lines drawn change: the skin and its shading keep every point.

// Where the seam lies (JOIN in scripts/build-head.mjs): a slanted line, its
// height at a depth z the height at the back plus SLOPE for each unit
// forward. `aboveSeam` is how far a point is above it.
const SEAM = { z: -56, y: -38, slope: (-76 + 38) / (15 + 56) };
export const aboveSeam = (y: number, z: number) =>
  y - (SEAM.y + (z - SEAM.z) * SEAM.slope);
// How far either side of the seam points may be merged, and how short an
// edge there must be, against the usual edge just above it, to be merged.
const NEAR = 6;
const SHORT = 0.7;
// The band above the seam whose edges give the usual length.
const USUAL = [8, 20];
const PASSES = 2;

const median = (values: number[]) => {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)] ?? 0;
};

// The skin's edges, each once, as pairs of point indices.
function edgesOf(index: ArrayLike<number>): [number, number][] {
  const seen = new Set<string>();
  const edges: [number, number][] = [];
  for (let t = 0; t < index.length; t += 3)
    for (let k = 0; k < 3; k++) {
      const a = index[t + k]!;
      const b = index[t + ((k + 1) % 3)]!;
      const key = a < b ? `${a} ${b}` : `${b} ${a}`;
      if (seen.has(key)) continue;
      seen.add(key);
      edges.push([a, b]);
    }
  return edges;
}

// The index of the wireframe's triangles for a skin of `positions` (x, y, z
// in turn) and triangle `index`.
export function wireIndex(
  positions: ArrayLike<number>,
  index: ArrayLike<number>,
): Uint32Array {
  const above = (i: number) =>
    aboveSeam(positions[i * 3 + 1]!, positions[i * 3 + 2]!);
  const length = (a: number, b: number) =>
    Math.hypot(
      positions[a * 3]! - positions[b * 3]!,
      positions[a * 3 + 1]! - positions[b * 3 + 1]!,
      positions[a * 3 + 2]! - positions[b * 3 + 2]!,
    );
  const edges = edgesOf(index);
  const usual = median(
    edges
      .filter(([a, b]) => {
        const h = (above(a) + above(b)) / 2;
        return h > USUAL[0]! && h < USUAL[1]!;
      })
      .map(([a, b]) => length(a, b)),
  );
  // Each point's stand-in: itself, or the point it was merged into.
  const into = new Map<number, number>();
  const root = (i: number): number => {
    const j = into.get(i);
    return j === undefined ? i : root(j);
  };
  const near = edges.filter(
    ([a, b]) => Math.abs(above(a)) < NEAR && Math.abs(above(b)) < NEAR,
  );
  for (let pass = 0; pass < PASSES; pass++) {
    const merged = new Set<number>();
    const short = near
      .map(([a, b]) => [root(a), root(b)] as const)
      .filter(([a, b]) => a !== b && length(a, b) < SHORT * usual)
      .sort(([a, b], [c, d]) => length(a, b) - length(c, d));
    for (const [a, b] of short) {
      if (merged.has(a) || merged.has(b)) continue;
      into.set(b, a);
      merged.add(a).add(b);
    }
    if (!merged.size) break;
  }
  const out: number[] = [];
  for (let t = 0; t < index.length; t += 3) {
    const [a, b, c] = [0, 1, 2].map((k) => root(index[t + k]!)) as [
      number,
      number,
      number,
    ];
    if (a !== b && b !== c && a !== c) out.push(a, b, c);
  }
  return Uint32Array.from(out);
}
