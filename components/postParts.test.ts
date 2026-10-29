import { describe, expect, it } from 'vitest';

import { phoneParts, showsMore } from './postParts';

describe('phoneParts', () => {
  it('keeps the technology behind More while the description is cut', () => {
    expect(phoneParts(true, true)).toEqual({
      technologyClass: 'hidden md:block',
      isMore: true,
    });
  });

  it('shows the technology and no More when the lines hold the whole description', () => {
    expect(phoneParts(true, false)).toEqual({
      technologyClass: 'max-md:basis-full',
      isMore: false,
    });
  });

  it('leaves a card that is not clamped as it is', () => {
    expect(phoneParts(false, true)).toEqual({
      technologyClass: '',
      isMore: false,
    });
  });
});

describe('showsMore', () => {
  it('shows More when the text is cut, and Less when open', () => {
    expect(showsMore(false, false, true)).toBe(true);
    expect(showsMore(true, false, false)).toBe(true);
    expect(showsMore(false, false, false)).toBe(false);
  });

  it('never shows it on a card laid open for a short window', () => {
    expect(showsMore(false, true, true)).toBe(false);
  });
});
