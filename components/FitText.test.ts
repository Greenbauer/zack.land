import { describe, expect, it } from 'vitest';

import { linesThatFit } from './FitText';

describe('linesThatFit', () => {
  it('leaves text that fits whole', () => {
    expect(linesThatFit(200, 28, 196)).toBeNull();
    expect(linesThatFit(200, 28, 201)).toBeNull();
  });

  it('keeps only the whole lines that fit', () => {
    // 7 lines of 28px fill 196px of a 210px room; the 8th would cross it.
    expect(linesThatFit(210, 28, 400)).toBe(7);
    expect(linesThatFit(223, 28, 400)).toBe(8);
  });

  it('keeps at least one line', () => {
    expect(linesThatFit(10, 28, 400)).toBe(1);
  });
});
