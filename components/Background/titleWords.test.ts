import { afterEach, describe, expect, it } from 'vitest';

import { isCurrent, TitleWord, titleWords } from './titleWords';

const word = (text: string) =>
  ({ text, word: {}, baseline: {} }) as unknown as TitleWord;

describe('isCurrent', () => {
  afterEach(() => titleWords.clear());

  it('holds while the same words stay registered', () => {
    const zack = word('ZACK');
    const name = word("GREENBAUER'S");
    titleWords.set(0, zack).set(1, name);
    expect(isCurrent([zack, name])).toBe(true);
  });

  it('fails when a page swaps its words for as many others', () => {
    const zack = word('ZACK');
    const name = word("GREENBAUER'S");
    titleWords.set(100, word('CONTACT')).set(101, word('ME'));
    expect(isCurrent([zack, name])).toBe(false);
  });

  it('fails when the count changes', () => {
    const web = word('WEB');
    titleWords.set(100, web);
    expect(isCurrent([web, word('APPS')])).toBe(false);
    expect(isCurrent([])).toBe(false);
  });
});
