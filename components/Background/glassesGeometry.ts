import { BufferAttribute, BufferGeometry, FileLoader } from 'three';

// The Banner Eyewear sunglasses (files/glasses.bin, written by
// scripts/story/build-glasses.mjs from Zack's own models): their front
// frame, lenses, left and right arms, and the word each arm carries (BANNER
// on the right, EYEWEAR on the left, built by the Banner Eyewear site's own
// code), in the models' own millimetres, lenses facing +z. The home page's
// story drops them onto the head (StoryProps.tsx), which fetches them only
// once a chapter is showing.

export const GLASSES_PARTS = [
  'frame',
  'lenses',
  'left',
  'right',
  'leftText',
  'rightText',
] as const;
export type GlassesPart = (typeof GLASSES_PARTS)[number];
export type Glasses = Record<GlassesPart, BufferGeometry>;

// Imported, so the build serves it under a hashed name with a year's cache.
export const GLASSES_URL = new URL('./files/glasses.bin', import.meta.url).href;

type Part = {
  vertices: number;
  triangles: number;
  position: number;
  index: number;
  // The lenses' texture coordinates, where their logo lies.
  uv?: number;
};

// The unzipped file as geometries (its layout: build-glasses.mjs).
export function decodeGlasses(buffer: ArrayBuffer): Glasses {
  const view = new DataView(buffer);
  const length = view.getUint32(0, true);
  const header = JSON.parse(
    new TextDecoder().decode(new Uint8Array(buffer, 4, length)),
  ) as { unit: number; parts: Record<GlassesPart, Part> };
  const base = 4 + length + ((4 - ((4 + length) % 4)) % 4);
  const part = ({ vertices, triangles, position, index, uv }: Part) => {
    const geometry = new BufferGeometry();
    // Positions are whole steps of 1/unit millimetres.
    const steps = new Int16Array(buffer, base + position, vertices * 3);
    const millimetres = new Float32Array(steps.length);
    for (let k = 0; k < steps.length; k++)
      millimetres[k] = steps[k]! / header.unit;
    geometry.setAttribute('position', new BufferAttribute(millimetres, 3));
    if (uv !== undefined)
      geometry.setAttribute(
        'uv',
        new BufferAttribute(
          new Uint16Array(buffer, base + uv, vertices * 2),
          2,
          true,
        ),
      );
    // A part of over 65535 vertices needs wide indices.
    const Indices = vertices > 65535 ? Uint32Array : Uint16Array;
    geometry.setIndex(
      new BufferAttribute(new Indices(buffer, base + index, triangles * 3), 1),
    );
    // The file holds no normals: a part's hard edges are faces that share
    // no vertices, so these come out sharp there and smooth elsewhere.
    geometry.computeVertexNormals();
    return geometry;
  };
  return Object.fromEntries(
    GLASSES_PARTS.map((name) => [name, part(header.parts[name])]),
  ) as Glasses;
}

// The file, fetched and unzipped, once. A failed load is not kept, so the
// next call tries again.
let loading: Promise<Glasses> | undefined;
export function loadGlasses(): Promise<Glasses> {
  loading ??= new FileLoader()
    .setResponseType('arraybuffer')
    .loadAsync(GLASSES_URL)
    .then((zipped) =>
      new Response(
        new Blob([zipped as ArrayBuffer])
          .stream()
          .pipeThrough(new DecompressionStream('gzip')),
      ).arrayBuffer(),
    )
    .then(decodeGlasses)
    .catch((error) => {
      loading = undefined;
      throw error;
    });
  return loading;
}
