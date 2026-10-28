import { describe, expect, it } from 'vitest';

import { ABOVE_BROWS, endsAboveBrows } from './useCardOnTop';

describe('a card at the top of the window', () => {
  it('goes there only if it ends above the head’s brows', () => {
    // 957 by 1246: the card runs from 160 to 404, above 0.4 of 1246 (498).
    expect(endsAboveBrows(160, 244, 1246)).toBe(true);
    // 900 by 700: it would run to 353, past 0.4 of 700 (280), over the face.
    expect(endsAboveBrows(160, 193, 700)).toBe(false);
    expect(endsAboveBrows(0, ABOVE_BROWS * 1000, 1000)).toBe(true);
  });
});
