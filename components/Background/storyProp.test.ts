import { describe, expect, it } from 'vitest';

import type { StoryCue } from './storyCue';
import { phoneSwap, propTarget } from './storyProp';

const cue = (prop: StoryCue['prop']): StoryCue => ({
  beats: [],
  since: 10,
  card: { x: 0, y: 0 },
  prop,
});

describe("a chapter's prop", () => {
  it('comes in at once, as its chapter does, and is only the one it brings', () => {
    expect(propTarget(cue('sunglasses'), 'sunglasses')).toBe(1);
    expect(propTarget(cue('plane'), 'sunglasses')).toBe(0);
    expect(propTarget(cue(undefined), 'tortillas')).toBe(0);
    expect(propTarget(null, 'wireframe')).toBe(0);
  });

  it('slides the head out, then the phone in, never showing both', () => {
    expect(phoneSwap(0)).toEqual({ head: 0, phone: 1 });
    expect(phoneSwap(0.5)).toEqual({ head: 1, phone: 1 });
    expect(phoneSwap(1)).toEqual({ head: 1, phone: 0 });
    for (let through = 0; through <= 1; through += 0.05) {
      const { head, phone } = phoneSwap(through);
      expect(head === 1 || phone === 1).toBe(true);
    }
    // Gathering speed out, slowing in.
    expect(phoneSwap(0.25).head).toBeCloseTo(0.25);
    expect(phoneSwap(0.75).phone).toBeCloseTo(0.25);
  });

  it('keeps the wireframe until the head has slid off for the phone', () => {
    const now = {
      sunglasses: 0,
      sleepmask: 0,
      plane: 0,
      tortillas: 0,
      wireframe: 0.9,
      phone: 0.3,
    };
    expect(propTarget(cue('phone'), 'wireframe', now)).toBe(0.9);
    expect(propTarget(cue('phone'), 'wireframe', { ...now, phone: 0.6 })).toBe(
      0,
    );
    expect(propTarget(cue('plane'), 'wireframe', now)).toBe(0);
  });
});
