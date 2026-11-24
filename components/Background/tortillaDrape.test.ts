import { describe, expect, it } from 'vitest';

import { meshes } from './headFixture';
import { DRAPE_GAP, drapeOnto, drapeSurface, sideOf } from './tortillaDrape';

describe('a tortilla draped over the side of the head', () => {
  const skin = meshes.get('skin')!.positions;
  // The side on the screen's left (-x), its middle 8 along z.
  const frame = sideOf(-1, 8);
  const surface = drapeSurface(skin, frame);
  // How far out the skin is at its outermost near (z, y) on that side.
  const outermost = (z: number, y: number) => {
    let out = -Infinity;
    for (let k = 0; k < skin.length; k += 3)
      if (Math.abs(skin[k + 2]! - z) < 3 && Math.abs(skin[k + 1]! - y) < 3)
        out = Math.max(out, -skin[k]!);
    return out;
  };

  it('lies on the cheek and the side of the head, never inside them', () => {
    for (const [z, y] of [
      [8, 4],
      [20, -20],
      [-10, 20],
      [0, -40],
    ] as const)
      expect(surface((z - 8) * -1, y)).toBeGreaterThanOrEqual(outermost(z, y));
  });

  it('wraps round toward the face and the back, and hangs below the jaw', () => {
    // Further round toward the face it lies further in.
    expect(surface(-60, 4)).toBeLessThan(surface(0, 4));
    // Below the jaw it hangs out from the neck.
    expect(surface(0, -100)).toBeGreaterThan(outermost(8, -100));
  });

  it('lays a flat round onto it as points of the head, or leaves it flat', () => {
    const rest = [0, 0, 0, 10, -5, 0];
    const out = new Float32Array(6);
    drapeOnto(rest, { across: 0, up: 4 }, surface, frame, 1, 50, out);
    // Out along -x, at the cheek's own height and depth.
    expect(out[0]).toBeCloseTo(-(surface(0, 4) + DRAPE_GAP));
    expect(out[1]).toBe(4);
    expect(out[2]).toBe(8);
    // Ten across is ten toward the back (-z) on this side.
    expect(out[5]).toBe(8 - 10);
    drapeOnto(rest, { across: 0, up: 4 }, surface, frame, 0, 50, out);
    expect(out[0]).toBe(-50);
  });
});
