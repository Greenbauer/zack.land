import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

import { Data3DTexture } from 'three';
import { LUTCubeLoader } from 'three-stdlib';
import { describe, expect, it } from 'vitest';

import { pageFiles } from '../../scripts/pageFiles';
import { decodeHead } from './headGeometry';
import { LUTBytesLoader } from './lutBytes';
import { SHOWN_EXPRESSIONS } from './shownExpressions';

const root = path.join(__dirname, '../..');
const read = (file: string) => fs.readFileSync(path.join(root, file));
const arrayBuffer = (bytes: Buffer) =>
  bytes.buffer.slice(
    bytes.byteOffset,
    bytes.byteOffset + bytes.length,
  ) as ArrayBuffer;
const unzipped = (file: string) => arrayBuffer(zlib.gunzipSync(read(file)));

describe("the page's scene files", () => {
  it('are up to date with their sources', () => {
    for (const [file, bytes] of Object.entries(pageFiles(SHOWN_EXPRESSIONS))) {
      expect(
        read(`components/Background/files/${file}`).equals(bytes),
        `run node scripts/build-page-files.mjs (${file})`,
      ).toBe(true);
    }
  });

  it("hold the head the page made of the whole file: only the shown expressions' moves", () => {
    const full = decodeHead(
      unzipped('scripts/head/head.bin'),
      SHOWN_EXPRESSIONS,
    );
    const page = decodeHead(unzipped('components/Background/files/head.bin'));
    expect(page.expressions).toEqual(full.expressions);
    expect(page.expressions).toHaveLength(SHOWN_EXPRESSIONS.length);
    expect(page.meshes).toEqual(full.meshes);
    // The source keeps the rest (12 more, a shrug among them).
    expect(decodeHead(unzipped('scripts/head/head.bin')).expressions).toContain(
      'shrug',
    );
  });

  it('hold the colour table as the same texture LUTCubeLoader made of the .cube', () => {
    const old = new LUTCubeLoader().parse(
      read('scripts/environment/cubicle-99.cube').toString('utf8'),
    ).texture3D as Data3DTexture;
    const { texture3D } = new LUTBytesLoader().parse(
      arrayBuffer(read('components/Background/files/cubicle-99.lut')),
    );
    expect(texture3D.image.data).toEqual(old.image.data);
    const image = old.image as { width: number; height: number; depth: number };
    for (const key of ['width', 'height', 'depth'] as const)
      expect(texture3D.image[key]).toBe(image[key]);
    for (const key of [
      'type',
      'format',
      'magFilter',
      'minFilter',
      'wrapS',
      'wrapT',
      'wrapR',
      'generateMipmaps',
      'colorSpace',
      'flipY',
      'unpackAlignment',
    ] as const)
      expect(texture3D[key], key).toBe(old[key]);
  });
});
