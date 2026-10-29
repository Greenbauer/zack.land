import { describe, expect, it } from 'vitest';

import { closeOnReturn } from './useMoreMotion';

describe('an opened post as the page moves', () => {
  it('stays open while it is the one in view', () => {
    expect(closeOnReturn(true, true, false)).toEqual({
      hasLeft: false,
      close: false,
      wait: false,
    });
  });

  it('waits, then closes, once the page has moved on from it', () => {
    expect(closeOnReturn(true, false, false)).toEqual({
      hasLeft: true,
      close: false,
      wait: true,
    });
  });

  it('closes as the page comes back to it before then', () => {
    expect(closeOnReturn(true, true, true)).toEqual({
      hasLeft: false,
      close: true,
      wait: false,
    });
  });

  it('does nothing once closed', () => {
    expect(closeOnReturn(false, false, true)).toEqual({
      hasLeft: false,
      close: false,
      wait: false,
    });
  });
});
