import { describe, expect, it } from 'vitest';

import { expressions } from './headFixture';
import { ONE_SIDED, oneSided } from './oneSided';
import { SIDED } from './sideMorphs';

describe('the one-sided expressions', () => {
  it('are made of expressions head.bin has and the page can split', () => {
    for (const { side, other = {} } of Object.values(ONE_SIDED))
      for (const base of [...Object.keys(side), ...Object.keys(other)]) {
        expect(expressions).toContain(base);
        expect(SIDED).toContain(base);
      }
  });

  it('puts the expression on the named side, and its counterpart across', () => {
    expect(oneSided('wink', 'Left')).toMatchObject({
      blinkTightLeft: 1,
      browDownLeft: 0.5,
    });
    expect(oneSided('browRaise', 'Right')).toEqual({
      browsUpRight: 0.6,
      browOuterUpRight: 1,
      browDownLeft: 0.6,
    });
  });
});
