// Rebuilds the surface across the head-to-neck seam as one smooth curve.
//
// Around a vertical axis through `centre` (x, z), the neck near the seam is a
// tube: at each angle and height its surface is a distance from the axis.
// Every vertex from `below` units under the seam to `above` units over it is
// moved along its own ray from the axis onto a cubic that starts on the body
// with the body's slope and ends on the head with the head's slope, so the
// surface turns smoothly across the seam with no crease. `height(p)` is a
// point's height over the seam. The rebuild fades out toward the throat over
// `front`, a range of the sine of the angle around the axis (1 is straight
// ahead), where the head's surface curves up into the jaw too soon for it.

const BINS = 72;
const HARMONICS = 12;

const smoothstep = (x, low, high) => {
  const t = Math.min(Math.max((x - low) / (high - low), 0), 1);
  return t * t * (3 - 2 * t);
};

// The tube's distance from the axis at one height, as a smooth function of
// the angle: the vertices within a unit of that height, averaged per angle
// bin, then fitted with a short Fourier series.
function ring(vertices, height, centre, at) {
  const sums = Array.from({ length: BINS }, () => [0, 0]);
  for (const p of vertices) {
    if (Math.abs(height(p) - at) > 1) continue;
    const dx = p[0] - centre[0];
    const dz = p[2] - centre[1];
    const bin =
      Math.floor(((Math.atan2(dz, dx) + Math.PI) / (2 * Math.PI)) * BINS) %
      BINS;
    sums[bin][0] += Math.hypot(dx, dz);
    sums[bin][1] += 1;
  }
  const known = sums.flatMap(([sum, count], k) =>
    count ? [{ k, value: sum / count }] : [],
  );
  // Empty bins take the value of the nearest filled one.
  const values = sums.map((_, k) => {
    const distance = (j) => Math.min(Math.abs(j - k), BINS - Math.abs(j - k));
    return known.reduce((best, p) =>
      distance(p.k) < distance(best.k) ? p : best,
    ).value;
  });
  const angle = (k) => -Math.PI + ((k + 0.5) * 2 * Math.PI) / BINS;
  const terms = Array.from({ length: HARMONICS + 1 }, (_, h) =>
    values.reduce(
      ([c, s], v, k) => [
        c + (v * Math.cos(h * angle(k)) * (h ? 2 : 1)) / BINS,
        s + (v * Math.sin(h * angle(k)) * 2) / BINS,
      ],
      [0, 0],
    ),
  );
  return (a) =>
    terms.reduce(
      (sum, [c, s], h) => sum + c * Math.cos(h * a) + s * Math.sin(h * a),
      0,
    );
}

export function bridge(
  { head, body, all },
  { height, centre, above, below, front },
) {
  const step = 3;
  const top = ring(head, height, centre, above);
  const topSlope = ring(head, height, centre, above + step);
  const bottom = ring(body, height, centre, -below);
  const bottomSlope = ring(body, height, centre, -below - step);
  const span = above + below;
  return all.map((p) => {
    const h = height(p);
    if (h <= -below || h >= above) return p;
    const dx = p[0] - centre[0];
    const dz = p[2] - centre[1];
    const a = Math.atan2(dz, dx);
    const s = (h + below) / span;
    const from = bottom(a);
    const to = top(a);
    const fromSlope = ((from - bottomSlope(a)) / step) * span;
    const toSlope = ((topSlope(a) - to) / step) * span;
    let radius =
      (2 * s ** 3 - 3 * s ** 2 + 1) * from +
      (s ** 3 - 2 * s ** 2 + s) * fromSlope +
      (-2 * s ** 3 + 3 * s ** 2) * to +
      (s ** 3 - s ** 2) * toSlope;
    const r = Math.hypot(dx, dz) || 1;
    const weight = 1 - smoothstep(Math.sin(a), ...front);
    radius = r + (radius - r) * weight;
    return [centre[0] + (dx / r) * radius, p[1], centre[1] + (dz / r) * radius];
  });
}
