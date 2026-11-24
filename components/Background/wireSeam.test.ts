import { describe, expect, it } from 'vitest';

import { meshes } from './headFixture';
import { aboveSeam, linesPerBand, wireStrength } from './wireSeam';

describe("the wireframe's seam round the neck", () => {
  const { positions, indices } = meshes.get('skin')!;
  const count = linesPerBand(positions, indices);
  const strength = wireStrength(positions, indices);
  // How dark each 2-unit band draws: its lines, each as strong as its ends
  // on average.
  const darkness = (() => {
    const out = new Map<number, number>();
    const seen = new Set<string>();
    for (let t = 0; t < indices.length; t += 3)
      for (let k = 0; k < 3; k++) {
        const a = indices[t + k]!;
        const b = indices[t + ((k + 1) % 3)]!;
        const key = a < b ? `${a} ${b}` : `${b} ${a}`;
        if (seen.has(key)) continue;
        seen.add(key);
        const band = Math.round(
          aboveSeam(
            (positions[a * 3 + 1]! + positions[b * 3 + 1]!) / 2,
            (positions[a * 3 + 2]! + positions[b * 3 + 2]!) / 2,
          ) / 2,
        );
        out.set(band, (out.get(band) ?? 0) + (strength[a]! + strength[b]!) / 2);
      }
    return out;
  })();
  const around = [darkness.get(5)!, darkness.get(-6)!];

  it('was crowded at the seam: that was the line', () => {
    expect(count.get(-1)!).toBeGreaterThan(1.8 * count.get(5)!);
  });

  it('draws the seam about as dark as the neck either side, no line and no gap', () => {
    for (const band of [-2, -1, 0]) {
      expect(darkness.get(band)!).toBeLessThan(1.25 * Math.max(...around));
      expect(darkness.get(band)!).toBeGreaterThan(0.75 * Math.min(...around));
    }
  });

  it('draws the rest of the head at full strength', () => {
    for (let i = 0; i < strength.length; i += 97)
      if (
        Math.abs(aboveSeam(positions[i * 3 + 1]!, positions[i * 3 + 2]!)) > 20
      )
        expect(strength[i]).toBe(1);
  });
});
