import { describe, expect, it } from 'vitest';

import {
  REACT_SECONDS,
  SMILE_SECONDS,
  stepTaps,
  tapExpressions,
  tapHead,
  tapsOn,
  untapped,
} from './headTaps';

describe('tapping the head', () => {
  it('is angry and surprised on the first and second tap, really angry on the third', () => {
    const first = tapHead(untapped, 0);
    const second = tapHead(first, 1);
    const third = tapHead(second, 2);
    expect(tapExpressions(first)).toEqual({ gasp: 0.8, squint: 0.7 });
    expect(tapExpressions(second)).toEqual(tapExpressions(first));
    expect(tapExpressions(third)).toEqual({ pout: 1, squint: 1 });
  });

  it('starts over on the fourth tap', () => {
    let taps = untapped;
    for (let k = 0; k < 4; k++) taps = tapHead(taps, k);
    expect(taps).toMatchObject({ phase: 'reacting', count: 1 });
  });

  it('smiles after a pause, then goes back to looking around', () => {
    let taps = tapHead(untapped, 10);
    taps = stepTaps(taps, 10 + REACT_SECONDS - 0.1);
    expect(taps.phase).toBe('reacting');
    taps = stepTaps(taps, 10 + REACT_SECONDS);
    expect(taps.phase).toBe('smiling');
    expect(tapExpressions(taps)).toEqual({ smile: 1 });
    const smiledAt = 10 + REACT_SECONDS;
    taps = stepTaps(taps, smiledAt + SMILE_SECONDS);
    expect(taps).toBe(untapped);
    expect(tapsOn(taps)).toBe(false);
  });

  it('holds the reaction while taps keep coming, counted from the last', () => {
    let taps = tapHead(untapped, 0);
    taps = tapHead(taps, REACT_SECONDS - 0.5);
    expect(stepTaps(taps, REACT_SECONDS + 0.1).phase).toBe('reacting');
  });

  it('starts at the first reaction when tapped while smiling', () => {
    const smiling = stepTaps(tapHead(untapped, 0), REACT_SECONDS);
    expect(tapHead(smiling, REACT_SECONDS + 1)).toMatchObject({ count: 1 });
  });
});
