import { describe, expect, it } from 'vitest';

import { turnMessage } from './arrival';

describe('the words a page turn announces', () => {
  it('names the post and where it is in the page', () => {
    expect(turnMessage('Smart Bed', 0, 4)).toBe('Smart Bed, 1 of 4');
    expect(turnMessage('Shofar Mount', 3, 4)).toBe('Shofar Mount, 4 of 4');
  });
});
