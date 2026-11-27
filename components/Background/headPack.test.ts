import { describe, expect, it } from 'vitest';

import { packHead, unpackHead } from './headPack';

describe("the page's head file packing", () => {
  it('gives back every byte it was given, an odd last byte included', () => {
    for (const length of [0, 1, 2, 5, 6, 7, 1001]) {
      const bytes = Uint8Array.from({ length }, (_, k) => (k * 97 + 13) % 256);
      expect(new Uint8Array(unpackHead(packHead(bytes)))).toEqual(bytes);
    }
  });

  it('wraps round where a word is smaller than the one three before it', () => {
    const words = new Uint16Array([65535, 0, 40000, 1, 65534, 2, 0]);
    const bytes = new Uint8Array(words.buffer);
    expect(new Uint16Array(unpackHead(packHead(bytes)))).toEqual(words);
  });
});
