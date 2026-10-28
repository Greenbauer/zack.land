import { describe, expect, it } from 'vitest';

import { FEATHER_FROM, SPREAD_PX } from './glass';
import { BRIGHTEST, DIMMEST } from './glassTint';
import { boundTable, displacement, PHOTO_REACH, strengthAt } from './photoLens';

const toLinear = (s: number) =>
  s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;

describe('the glass over photos', () => {
  it('keeps photos under a dark card no brighter than its bound', () => {
    const table = boundTable('dark');
    // Each channel at most the cap, so the luminance at most BRIGHTEST.
    expect(toLinear(Math.max(...table))).toBeCloseTo(BRIGHTEST, 5);
    // Darker values pass unchanged.
    expect(table[0]).toBe(0);
    expect(table[2]).toBeCloseTo(2 / 16, 6);
  });

  it('keeps photos under a light card no dimmer than its bound', () => {
    const table = boundTable('light');
    expect(toLinear(Math.min(...table))).toBeCloseTo(DIMMEST, 5);
    expect(table.at(-1)).toBe(1);
  });

  it('bends as the scene’s lenses do', () => {
    // A lens's edge, half a lens from its centre, shows the point SPREAD_PX
    // the other side of the centre: half the scale is that whole distance.
    expect(displacement(14) / 2).toBe(SPREAD_PX + 7);
  });

  it('eases in from nothing at its reach to whole inside the card’s edge', () => {
    expect(strengthAt(0)).toBe(0);
    // At the card's edge, part way.
    const atEdge = strengthAt(PHOTO_REACH);
    expect(atEdge).toBeGreaterThan(0.5);
    expect(atEdge).toBeLessThan(1);
    expect(strengthAt(PHOTO_REACH - FEATHER_FROM)).toBe(1);
    // Smooth: no step anywhere along the way.
    for (let edge = 1; edge <= PHOTO_REACH - FEATHER_FROM; edge++)
      expect(strengthAt(edge) - strengthAt(edge - 1)).toBeLessThan(0.03);
  });
});
