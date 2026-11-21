import { describe, expect, it } from 'vitest';

import type { StoryCue } from './storyCue';
import { BANG_SECONDS, PROP_DELAY, propTarget } from './storyProp';

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
    expect(propTarget(cue(undefined), 'agents', 60)).toBe(0);
    expect(propTarget(null, 'wireframe', 60)).toBe(0);
  });

  it('flashes the bang for a moment only, fading', () => {
    const bang = cue('bang');
    const at = 10 + PROP_DELAY.bang;
    expect(propTarget(bang, 'bang', at + 0.001)).toBeCloseTo(1, 1);
    expect(propTarget(bang, 'bang', at + BANG_SECONDS / 2)).toBeCloseTo(0.5);
    expect(propTarget(bang, 'bang', at + BANG_SECONDS + 0.01)).toBe(0);
  });
});
