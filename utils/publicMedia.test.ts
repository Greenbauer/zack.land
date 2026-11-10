import fs from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

// Files in public/ are served byte for byte, so a location a phone wrote
// into a photo or a video is published with it. (The resized copies that
// next/image serves drop it; the file's own address does not.)
const PUBLIC = path.join(__dirname, '../public');

const filesUnder = (dir: string): string[] =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const file = path.join(dir, entry.name);
    return entry.isDirectory() ? filesUnder(file) : [file];
  });

type Kind = 'jpeg' | 'png' | 'gif' | 'webp' | 'video' | 'unreadable' | 'other';

// File endings that mean a photo or a video, whatever is inside.
const MEDIA_ENDINGS =
  /\.(jpe?g|png|gif|webp|mp4|mov|m4v|webm|heic|heif|avif|tiff?|bmp)$/i;
// The "ftyp" brands of HEIC and AVIF photos, which keep their Exif where
// this test does not look.
const PHOTO_BRANDS = /^(hei|hev|mif|msf|avi)/;

// What a file is, read from its first bytes, not its name: a ".jpg" can
// hold a WebP. A photo or video this test has no reader for is "unreadable".
function kindOf(file: string, data: Buffer): Kind {
  const text = (from: number, to: number) => data.toString('latin1', from, to);
  if (text(0, 2) === '\xff\xd8') return 'jpeg';
  if (text(1, 4) === 'PNG') return 'png';
  if (text(0, 3) === 'GIF') return 'gif';
  if (text(0, 4) === 'RIFF' && text(8, 12) === 'WEBP') return 'webp';
  if (text(4, 8) === 'ftyp') {
    return PHOTO_BRANDS.test(text(8, 12)) ? 'unreadable' : 'video';
  }
  return MEDIA_ENDINGS.test(file) ? 'unreadable' : 'other';
}

const GPS_TAG = 0x8825;

// True when an Exif block (TIFF data, with or without its "Exif" prefix)
// has a GPS section listed in its first directory.
function exifHasGps(exif: Buffer): boolean {
  const tiff =
    exif.toString('latin1', 0, 6) === 'Exif\0\0' ? exif.subarray(6) : exif;
  const order = tiff.toString('latin1', 0, 2);
  if (order !== 'II' && order !== 'MM') return false;
  const read16 = (at: number) =>
    order === 'II' ? tiff.readUInt16LE(at) : tiff.readUInt16BE(at);
  const first = order === 'II' ? tiff.readUInt32LE(4) : tiff.readUInt32BE(4);
  for (let entry = 0; entry < read16(first); entry += 1) {
    if (read16(first + 2 + entry * 12) === GPS_TAG) return true;
  }
  return false;
}

// Each kind of photo keeps Exif in its own named block: a JPEG in APP1
// segments before the picture starts, a PNG in an "eXIf" chunk, a WebP in an
// "EXIF" chunk.
function* exifBlocks(kind: Kind, data: Buffer): Generator<Buffer> {
  const name = (at: number) => data.toString('latin1', at, at + 4);
  if (kind === 'jpeg') {
    let at = 2;
    while (data.readUInt8(at) === 0xff && data.readUInt8(at + 1) !== 0xda) {
      const length = data.readUInt16BE(at + 2);
      if (data.readUInt8(at + 1) === 0xe1) {
        yield data.subarray(at + 4, at + 2 + length);
      }
      at += 2 + length;
    }
  } else if (kind === 'png') {
    for (let at = 8; at + 8 <= data.length;) {
      const length = data.readUInt32BE(at);
      if (name(at + 4) === 'eXIf') yield data.subarray(at + 8, at + 8 + length);
      at += 12 + length;
    }
  } else if (kind === 'webp') {
    for (let at = 12; at + 8 <= data.length;) {
      const length = data.readUInt32LE(at + 4);
      if (name(at) === 'EXIF') yield data.subarray(at + 8, at + 8 + length);
      at += 8 + length + (length % 2);
    }
  }
}

// The names a QuickTime or MP4 file keeps a location under: 3GPP's box,
// QuickTime's older "©xyz" one and Apple's metadata key.
const VIDEO_LOCATIONS = ['loci', '\xa9xyz', 'com.apple.quicktime.location'];

// A video's top-level boxes: each starts with its length and a four-letter
// name. (A length of 1 means a 64-bit length follows; 0 means "to the end".)
function* boxes(data: Buffer): Generator<[string, Buffer]> {
  let at = 0;
  while (at + 8 <= data.length) {
    const short = data.readUInt32BE(at);
    const length =
      short === 1
        ? Number(data.readBigUInt64BE(at + 8))
        : short || data.length - at;
    if (length < 8) return;
    yield [
      data.toString('latin1', at + 4, at + 8),
      data.subarray(at, at + length),
    ];
    at += length;
  }
}

function hasLocation(kind: Kind, data: Buffer): boolean {
  if (kind === 'video') {
    // Only "moov", the box that describes the video, is searched: the
    // pictures and sound in the others could hold any four bytes by chance.
    return [...boxes(data)].some(
      ([name, box]) =>
        name === 'moov' &&
        VIDEO_LOCATIONS.some((mark) => box.includes(mark, 0, 'latin1')),
    );
  }
  if (kind === 'other' || kind === 'unreadable') return false;
  // XMP is text, wherever the photo keeps it.
  return (
    data.includes('GPSLatitude') || [...exifBlocks(kind, data)].some(exifHasGps)
  );
}

// The smallest files that carry a location, to show the check sees one.
const bytes = (text: string) => Buffer.from(text, 'latin1');
const exifWithGps = (order: 'II' | 'MM') => {
  const tiff = Buffer.alloc(26);
  tiff.write(order, 'latin1');
  const little = order === 'II';
  const write16 = (value: number, at: number) =>
    little ? tiff.writeUInt16LE(value, at) : tiff.writeUInt16BE(value, at);
  write16(42, 2);
  if (little) tiff.writeUInt32LE(8, 4);
  else tiff.writeUInt32BE(8, 4);
  write16(1, 8); // one entry in the first directory
  write16(GPS_TAG, 10);
  return tiff;
};
const box = (name: string, body: Buffer) => {
  const size = Buffer.alloc(4);
  size.writeUInt32BE(body.length + 8);
  return Buffer.concat([size, bytes(name), body]);
};
const jpegWith = (exif: Buffer) => {
  const body = Buffer.concat([bytes('Exif\0\0'), exif]);
  const size = Buffer.alloc(2);
  size.writeUInt16BE(body.length + 2);
  return Buffer.concat([
    bytes('\xff\xd8\xff\xe1'),
    size,
    body,
    bytes('\xff\xda'),
  ]);
};
// A video whose picture data happens to hold "loci" too.
const videoWith = (mark: string) =>
  Buffer.concat([
    box('ftyp', bytes('qt  ')),
    box('mdat', bytes('loci')),
    box('moov', box('udta', bytes(mark))),
  ]);

describe('the location check', () => {
  const found = (file: string, data: Buffer) =>
    hasLocation(kindOf(file, data), data);

  it.each(['II', 'MM'] as const)(
    'sees a GPS section in a JPEG whose Exif is in %s byte order',
    (order) => {
      expect(found('a.jpg', jpegWith(exifWithGps(order)))).toBe(true);
    },
  );

  it("sees a latitude in a photo's XMP text", () => {
    const png = bytes('\x89PNG\r\n\x1a\n<x:xmpmeta exif:GPSLatitude="1,2N"/>');

    expect(found('a.png', png)).toBe(true);
  });

  it.each(VIDEO_LOCATIONS)('sees a video location kept as %j', (mark) => {
    expect(found('a.mov', videoWith(mark))).toBe(true);
  });

  it('passes a photo and a video with none', () => {
    expect(found('a.jpg', jpegWith(bytes('II*\0\x08\0\0\0\0\0')))).toBe(false);
    expect(found('a.mov', videoWith('free'))).toBe(false);
  });

  it('reads a file by what is in it, and says when it cannot', () => {
    const exif = exifWithGps('II');
    const size = Buffer.alloc(4);
    size.writeUInt32LE(exif.length);
    const webp = Buffer.concat([bytes('RIFF\0\0\0\0WEBPEXIF'), size, exif]);
    expect(found('named.jpg', webp)).toBe(true);

    expect(kindOf('IMG_0001.HEIC', box('ftyp', bytes('heic')))).toBe(
      'unreadable',
    );
    expect(kindOf('scan.tiff', bytes('II*\0'))).toBe('unreadable');
    expect(kindOf('head.bin', bytes('\x1f\x8b\x08\0'))).toBe('other');
  });
});

describe('the media in public/', () => {
  const media = filesUnder(PUBLIC).map((file) => {
    const data = fs.readFileSync(file);
    return {
      name: path.relative(PUBLIC, file),
      data,
      kind: kindOf(file, data),
    };
  });

  it('carries no location', () => {
    const located = media
      .filter(({ kind, data }) => hasLocation(kind, data))
      .map(({ name }) => name);

    expect(located).toEqual([]);
  });

  // A HEIC, AVIF or TIFF photo could carry a location this test cannot see.
  // Convert it to a JPEG, PNG or WebP (or an MP4), or teach kindOf to read it.
  it('holds no photo or video of a kind the check cannot read', () => {
    const unreadable = media
      .filter(({ kind }) => kind === 'unreadable')
      .map(({ name }) => name);

    expect(unreadable).toEqual([]);
  });
});
