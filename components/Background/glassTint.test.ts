import { describe, expect, it } from 'vitest';

import { tintStrength } from './glass';
import {
  BRIGHTEST,
  CardTints,
  CHANGE_SECONDS,
  DIMMEST,
  type Rgb,
  skyOf,
} from './glassTint';

const PINK_DAWN: Rgb = [214, 160, 190];
const BLUE_NIGHT: Rgb = [40, 60, 140];

// A card element: only its data attributes are used.
const card = () => ({ dataset: {} }) as HTMLElement;

describe('glass tints', () => {
  it('put a card on the side of the sky around it, its text following', () => {
    const tints = new CardTints();
    const [dawn, night] = [card(), card()];
    tints.aim(dawn, PINK_DAWN);
    tints.aim(night, BLUE_NIGHT);
    expect(dawn.dataset.sky).toBe('light');
    expect(night.dataset.sky).toBe('dark');
    // Dark glass may be no brighter than BRIGHTEST; light no dimmer than
    // DIMMEST (as luminance ** (1 / 2.2)).
    expect(tints.shown(night, 0)).toEqual({
      light: 0,
      bounds: [0, BRIGHTEST ** (1 / 2.2)],
    });
    expect(tints.shown(dawn, 0)).toEqual({
      light: 1,
      bounds: [DIMMEST ** (1 / 2.2), 1],
    });
  });

  it('keep a card over the head on the dark side, whatever the sky', () => {
    const tints = new CardTints();
    const above = { dataset: { headAvoid: 'above' } } as unknown as HTMLElement;
    tints.aim(above, PINK_DAWN);
    expect(above.dataset.sky).toBe('dark');
  });

  it('change a card’s side over CHANGE_SECONDS, eased in and out', () => {
    const tints = new CardTints();
    const element = card();
    tints.aim(element, BLUE_NIGHT);
    tints.aim(element, PINK_DAWN);
    // Slow to start, as the text's ease-in-out.
    const early = tints.shown(element, CHANGE_SECONDS / 10).light;
    expect(early).toBeGreaterThan(0);
    expect(early).toBeLessThan(0.1);
    expect(tints.shown(element, (CHANGE_SECONDS * 4) / 10).light).toBeCloseTo(
      0.5,
      5,
    );
    expect(tints.shown(element, CHANGE_SECONDS / 2).light).toBe(1);
  });

  it('read the sky around a card past the head crossing part of it', () => {
    const head: Rgb = [10, 8, 40];
    const sky = skyOf([head, head, PINK_DAWN, PINK_DAWN]);
    sky.forEach((c, k) => expect(c).toBeCloseTo(PINK_DAWN[k]!, 0));
  });

  it('are clear on a large screen and tinted on a phone or a short one', () => {
    expect(tintStrength(1440, 900)).toBe(0);
    expect(tintStrength(375, 812)).toBeGreaterThan(0);
    expect(tintStrength(1440, 500)).toBeGreaterThan(0);
  });
});
