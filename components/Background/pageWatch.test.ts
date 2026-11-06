import { afterEach, describe, expect, it, vi } from 'vitest';

import { framedHead } from './headPlace';
import { faceInView } from './pageWatch';

// A page with its tab showing or not, its window focused or not, and
// nothing open over the head.
const page = (visibilityState: string, focused: boolean) =>
  vi.stubGlobal('document', {
    visibilityState,
    hasFocus: () => focused,
    querySelector: () => null,
  });

describe('whether the head can be seen, for its idle clock', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    framedHead.x = Number.NaN;
  });

  it('counts a window left showing while another window has focus', () => {
    framedHead.x = 400;
    page('visible', false);
    expect(faceInView()).toBe(true);
  });

  it('does not count a hidden tab', () => {
    framedHead.x = 400;
    page('hidden', true);
    expect(faceInView()).toBe(false);
  });
});
