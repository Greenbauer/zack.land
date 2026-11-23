import { describe, expect, it } from 'vitest';

import type { StoryCue } from './storyCue';
import { phoneSwap, PROP_DELAY, propTarget } from './storyProp';

const cue = (prop: StoryCue['prop']): StoryCue => ({
  beats: [],
  since: 10,
  card: { x: 0, y: 0 },
  prop,
});

describe("a chapter's prop", () => {
  it('comes in after its delay and stays while its chapter shows', () => {
    const glasses = cue('sunglasses');
    expect(
      propTarget(glasses, 'sunglasses', 10 + PROP_DELAY.sunglasses - 0.1),
    ).toBe(0);
    expect(
      propTarget(glasses, 'sunglasses', 10 + PROP_DELAY.sunglasses + 0.01),
    ).toBe(1);
    expect(propTarget(glasses, 'sunglasses', 60)).toBe(1);
  });

  it('is only the one its chapter brings', () => {
    expect(propTarget(cue('plane'), 'sunglasses', 60)).toBe(0);
    expect(propTarget(cue(undefined), 'tortillas', 60)).toBe(0);
    expect(propTarget(null, 'wireframe', 60)).toBe(0);
  });

  it('swaps the head for the phone, never showing both', () => {
    expect(phoneSwap(0)).toEqual({ head: 1, phone: 0 });
    expect(phoneSwap(0.5)).toEqual({ head: 0, phone: 0 });
    expect(phoneSwap(1)).toEqual({ head: 0, phone: 1 });
    for (let a = 0; a <= 1; a += 0.05) {
      const { head, phone } = phoneSwap(a);
      expect(head === 0 || phone === 0).toBe(true);
    }
    expect(phoneSwap(0.25).head).toBeCloseTo(0.5);
    expect(phoneSwap(0.75).phone).toBeCloseTo(0.5);
  });
});
