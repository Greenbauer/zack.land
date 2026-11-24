import { describe, expect, it } from 'vitest';

import { meshes } from './headFixture';
import { DRAPE_GAP, drapeOnto, drapeSurface } from './tortillaDrape';

describe('a tortilla draped over the face', () => {
  const skin = meshes.get('skin')!.positions;
  const surface = drapeSurface(skin);
  // The skin's frontmost point near (x, y).
  const front = (x: number, y: number) => {
    let z = -Infinity;
    for (let k = 0; k < skin.length; k += 3)
      if (Math.abs(skin[k]! - x) < 3 && Math.abs(skin[k + 1]! - y) < 3)
        z = Math.max(z, skin[k + 2]!);
    return z;
  };

  it('lies on the face, never inside it', () => {
    for (const [x, y] of [
      [0, 0],
      [15, 5],
      [-20, -30],
      [0, -55],
    ] as const)
      expect(surface(x, y)).toBeGreaterThanOrEqual(front(x, y));
  });

  it('hangs below the chin and folds back past the side of the head', () => {
    // Under the chin it hangs in front of the neck.
    expect(surface(0, -100)).toBeGreaterThan(front(0, -100));
    // Past the cheek it folds back, further back the further out.
    expect(surface(95, 0)).toBeLessThan(surface(60, 0));
  });

  it('lays a flat round onto it, or leaves it flat', () => {
    const rest = [0, 0, 0, 10, -5, 0];
    const out = new Float32Array(6);
    drapeOnto(rest, { x: 0, y: 0 }, surface, 1, 60, out);
    expect(out[2]).toBeCloseTo(surface(0, 0) + DRAPE_GAP);
    expect(out[3]).toBe(10);
    expect(out[4]).toBe(-5);
    drapeOnto(rest, { x: 0, y: 0 }, surface, 0, 60, out);
    expect(out[2]).toBe(60);
  });
});
