// How strongly the head's wireframe draws each point's lines (StoryProps.tsx),
// so the seam where the scanned head is joined to the body below it does
// not show as a line. There the head and the body were each cut by slicing
// their triangles, which left the cut edges crowded with points: over a few
// units round the seam the wireframe's lines were up to about 2.4 times as
// dense as on the neck either side, and drew a dark line round it. Here each
// band round the seam has its lines drawn fainter by just how much denser it
// is than the neck around it, so it is as dark as the rest. Leaving lines
// out instead opened a lighter strip with gaps; merging points tore it.

// Where the seam lies (JOIN in scripts/build-head.mjs): a slanted line, its
// height at a depth z the height at the back plus SLOPE for each unit
// forward. `aboveSeam` is how far a point is above it.
const SEAM = { z: -56, y: -38, slope: (-76 + 38) / (15 + 56) };
export const aboveSeam = (y: number, z: number) =>
  y - (SEAM.y + (z - SEAM.z) * SEAM.slope);
// The bands round the seam, BAND units tall, out to NEAR either side; the
// usual density is the median of those from USUAL out to NEAR.
const BAND = 2;
const NEAR = 16;
const USUAL = 8;

const median = (values: number[]) => {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)] ?? 0;
};

// How many lines (triangle edges, each once) have their middle in each band,
// for a skin of `positions` (x, y, z in turn) and triangle `index`.
export function linesPerBand(
  positions: ArrayLike<number>,
  index: ArrayLike<number>,
): Map<number, number> {
  const seen = new Set<string>();
  const count = new Map<number, number>();
  for (let t = 0; t < index.length; t += 3)
    for (let k = 0; k < 3; k++) {
      const a = index[t + k]!;
      const b = index[t + ((k + 1) % 3)]!;
      const key = a < b ? `${a} ${b}` : `${b} ${a}`;
      if (seen.has(key)) continue;
      seen.add(key);
      const above = aboveSeam(
        (positions[a * 3 + 1]! + positions[b * 3 + 1]!) / 2,
        (positions[a * 3 + 2]! + positions[b * 3 + 2]!) / 2,
      );
      const band = Math.round(above / BAND);
      count.set(band, (count.get(band) ?? 0) + 1);
    }
  return count;
}

// Each point's strength (0 to 1), for a skin of `positions` and triangle
// `index`: 1 away from the seam; near it, the usual density over its band's,
// eased between bands.
export function wireStrength(
  positions: ArrayLike<number>,
  index: ArrayLike<number>,
): Float32Array {
  const count = linesPerBand(positions, index);
  const reach = Math.round(NEAR / BAND);
  const usual = median(
    [...count.entries()]
      .filter(
        ([band]) => Math.abs(band) * BAND >= USUAL && Math.abs(band) <= reach,
      )
      .map(([, n]) => n),
  );
  const strengthOf = (band: number) =>
    Math.abs(band) > reach
      ? 1
      : Math.min(1, usual / (count.get(band) ?? usual));
  const out = new Float32Array(positions.length / 3);
  for (let i = 0; i < out.length; i++) {
    const at = aboveSeam(positions[i * 3 + 1]!, positions[i * 3 + 2]!) / BAND;
    const low = Math.floor(at);
    const t = at - low;
    out[i] = strengthOf(low) * (1 - t) + strengthOf(low + 1) * t;
  }
  return out;
}
