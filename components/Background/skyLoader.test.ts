import fs from 'node:fs';
import path from 'node:path';

import { CubeUVReflectionMapping, DataTexture, DataUtils } from 'three';
import { RGBELoader } from 'three-stdlib';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { SKY_FILE, SkyLoader } from './skyLoader';

const read = (file: string) => {
  const bytes = fs.readFileSync(path.join(__dirname, '../..', file));
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.length);
};
// Read as half floats (RGBELoader's default type, which its types leave out).
const parse = (file: string) => {
  const { width, height, data } = new RGBELoader().parse(read(file));
  const halves = new Uint16Array(
    data.buffer,
    data.byteOffset,
    data.byteLength / 2,
  );
  return { width, height, data: halves };
};

// The page's sky file (SKY_FILE), read from the repository.
const ATLAS = 'components/Background/files/kiara_1_dawn_1k_pmrem.hdr';

describe('the prefiltered sky', () => {
  const atlas = parse(ATLAS);

  it('is the atlas three makes of the sky, the size its PMREM gives it', () => {
    // PMREMGenerator.fromEquirectangular: cube faces a quarter of the sky's
    // width (a power of two), laid out 3 across and 4 down.
    const sky = parse('scripts/environment/kiara_1_dawn_1k.hdr');
    const cube = 2 ** Math.floor(Math.log2(sky.width / 4));
    expect(atlas.width).toBe(3 * Math.max(cube, 16 * 7));
    expect(atlas.height).toBe(4 * cube);
  });

  it('holds the sky: its six faces lit throughout', () => {
    const values = Array.from(atlas.data, DataUtils.fromHalfFloat);
    // The sharpest level, the six faces, fills the atlas's lower half: the
    // file's last rows, as it is written top row first.
    const faces = values.slice(values.length / 2);
    const lit = faces.filter((v, i) => i % 4 !== 3 && v > 0).length;
    expect(lit / ((faces.length * 3) / 4)).toBeGreaterThan(0.99);
  });

  it("was built by the three the page runs (its atlas's layout is three's)", () => {
    const header = Buffer.from(read(ATLAS).slice(0, 200))
      .toString('latin1')
      .match(/# three ([\d.]+)'s PMREM/);
    const three = JSON.parse(
      fs.readFileSync(
        path.join(__dirname, '../../node_modules/three/package.json'),
        'utf8',
      ),
    ).version;
    expect(header?.[1], 'run node scripts/build-environment.mjs').toBe(three);
  });
});

describe('SkyLoader', () => {
  afterEach(() => vi.restoreAllMocks());

  it('hands three the file as a cube UV atlas in linear colour', () => {
    vi.spyOn(RGBELoader.prototype, 'load').mockImplementation(function (
      this: RGBELoader,
      _url,
      onLoad,
    ) {
      onLoad?.(new DataTexture(), {});
      return new DataTexture();
    });
    const loaded = vi.fn();
    new SkyLoader().load(SKY_FILE, loaded);
    const texture: DataTexture = loaded.mock.calls[0]![0];
    expect(texture.mapping).toBe(CubeUVReflectionMapping);
    expect(texture.colorSpace).toBe('srgb-linear');
  });
});
