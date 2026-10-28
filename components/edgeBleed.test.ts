import { describe, expect, it } from 'vitest';

import { FEATHER_TO } from './Background/glass';
import { bleedsPast, GLASS_REACH_PX } from './edgeBleed';

describe("a card's glass at the window's edge", () => {
  it('runs past the edge only when the edge would cut its soft outline', () => {
    expect(GLASS_REACH_PX).toBe(FEATHER_TO);
    expect(bleedsPast(12)).toBe(true);
    expect(bleedsPast(80)).toBe(true);
    expect(bleedsPast(FEATHER_TO)).toBe(false);
    expect(bleedsPast(1000)).toBe(false);
  });
});
