import { BufferAttribute, BufferGeometry, FileLoader } from 'three';

// The Banner Eyewear sunglasses (files/glasses.bin, written by
// scripts/story/build-glasses.mjs from Zack's own models): their front
// frame, lenses, and left and right arms, in the models' own millimetres,
// lenses facing +z. The home page's story drops them onto the head
// (StoryProps.tsx), which fetches them only once a chapter is showing.

export type GlassesPart = 'frame' | 'lenses' | 'left' | 'right';
export type Glasses = Record<GlassesPart, BufferGeometry>;

// Imported, so the build serves it under a hashed name with a year's cache.
export const GLASSES_URL = new URL('./files/glasses.bin', import.meta.url).href;

type Part = {
  vertices: number;
  triangles: number;
  position: number;
  normal: number;
  index: number;
};

// The unzipped file as geometries (its layout: build-glasses.mjs).
export function decodeGlasses(buffer: ArrayBuffer): Glasses {
  const view = new DataView(buffer);
  const length = view.getUint32(0, true);
  const header = JSON.parse(
    new TextDecoder().decode(new Uint8Array(buffer, 4, length)),
  ) as { parts: Record<GlassesPart, Part> };
  const base = 4 + length + ((4 - ((4 + length) % 4)) % 4);
  const part = ({ vertices, triangles, position, normal, index }: Part) => {
    const geometry = new BufferGeometry();
    geometry.setAttribute(
      'position',
      new BufferAttribute(
        new Float32Array(buffer, base + position, vertices * 3),
        3,
      ),
    );
    geometry.setAttribute(
      'normal',
      new BufferAttribute(
        new Int8Array(buffer, base + normal, vertices * 3),
        3,
        true,
      ),
    );
    geometry.setIndex(
      new BufferAttribute(
        new Uint32Array(buffer, base + index, triangles * 3),
        1,
      ),
    );
    return geometry;
  };
  return {
    frame: part(header.parts.frame),
    lenses: part(header.parts.lenses),
    left: part(header.parts.left),
    right: part(header.parts.right),
  };
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
