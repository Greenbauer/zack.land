import { describe, expect, it } from 'vitest';

import { FEATHER_FROM, SPREAD_PX } from './glass';
import { BRIGHTEST, DIMMEST } from './glassTint';
import {
  boundTable,
  displacement,
  layerStyle,
  PHOTO_REACH,
  strengthAt,
} from './photoLens';

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

  it("lays a card's own layer PHOTO_REACH past it, just below it, as see-through as it", () => {
    const box = { left: 500, top: 600, width: 800, height: 300 };
    expect(layerStyle(box, '0.4', '20')).toEqual({
      left: `${500 - PHOTO_REACH}px`,
      top: `${600 - PHOTO_REACH}px`,
      width: `${800 + 2 * PHOTO_REACH}px`,
      height: `${300 + 2 * PHOTO_REACH}px`,
      opacity: '0.4',
      zIndex: '19',
    });
  });

  it('leaves the layer to DOM order under a card with no z-index', () => {
    const box = { left: 0, top: 0, width: 10, height: 10 };
    expect(layerStyle(box, '1', 'auto').zIndex).toBe('');
  });
});
