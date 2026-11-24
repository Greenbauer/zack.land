import { describe, expect, it } from 'vitest';

import { meshes } from './headFixture';
import { aboveSeam, wireIndex } from './wireSeam';

describe("the wireframe's seam round the neck", () => {
  const { positions, indices } = meshes.get('skin')!;
  const wire = wireIndex(positions, indices);
  // How many triangles have their middle in each 2-unit band above (or
  // below) the seam, round the back and sides of the neck.
  const bands = (index: ArrayLike<number>) => {
    const count = new Map<number, number>();
    for (let t = 0; t < index.length; t += 3) {
      const [y, z] = [1, 2].map(
        (axis) =>
          [0, 1, 2].reduce(
            (sum, k) => sum + positions[index[t + k]! * 3 + axis]!,
            0,
          ) / 3,
      );
      const band = Math.round(aboveSeam(y!, z!) / 2) * 2;
      count.set(band, (count.get(band) ?? 0) + 1);
    }
    return count;
  };

  it('is no denser at the seam than either side of it', () => {
    const skin = bands(indices);
    const drawn = bands(wire);
    // The skin itself is crowded there: that was the line.
    expect(skin.get(-2)!).toBeGreaterThan(1.8 * skin.get(10)!);
    // Its wireframe is not.
    const around = Math.max(drawn.get(10)!, drawn.get(-12)!);
    for (const band of [-4, -2, 0])
      expect(drawn.get(band)!).toBeLessThan(1.3 * around);
  });

  it('leaves the rest of the head as it is', () => {
    const skin = bands(indices);
    const drawn = bands(wire);
    for (const band of [-30, -20, 20, 30])
      expect(drawn.get(band)).toBe(skin.get(band));
  });
});
