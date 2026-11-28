// The page's head file (files/head.bin) is the head format headGeometry.ts
// describes, rearranged so gzip packs it tighter, then gzipped: almost all of
// it is 16-bit numbers in threes (a vertex's x, y and z; a triangle's three
// corners; an expression's x, y and z moves), and neighbours in a run of them
// are close. So each 16-bit word becomes its difference from the word three
// before it (wrapping round at 65536), and the words' low bytes go first, then
// their high bytes, which are mostly 0 or 255. gzip then makes 1.1 MB of what
// was 2.1 MB. An odd last byte, if any, is kept as it is.

export function packHead(bytes: Uint8Array): Uint8Array {
  const words = bytes.length >> 1;
  const out = new Uint8Array(bytes.length);
  const word = (i: number) => bytes[i * 2]! | (bytes[i * 2 + 1]! << 8);
  for (let i = 0; i < words; i++) {
    const change = (word(i) - (i >= 3 ? word(i - 3) : 0)) & 0xffff;
    out[i] = change & 0xff;
    out[words + i] = change >> 8;
  }
  if (bytes.length % 2) out[bytes.length - 1] = bytes[bytes.length - 1]!;
  return out;
}

export function unpackHead(packed: Uint8Array): ArrayBuffer {
  const words = packed.length >> 1;
  const out = new Uint8Array(packed.length);
  const view = new Uint16Array(out.buffer, 0, words);
  for (let i = 0; i < words; i++)
    view[i] =
      ((packed[i]! | (packed[words + i]! << 8)) + (i >= 3 ? view[i - 3]! : 0)) &
      0xffff;
  if (packed.length % 2) out[packed.length - 1] = packed[packed.length - 1]!;
  return out.buffer;
}
