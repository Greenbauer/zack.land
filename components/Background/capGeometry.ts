import { BufferAttribute, BufferGeometry, FileLoader } from 'three';

// The graduation cap (files/cap.bin), modelled in Blender on the head's own
// shape, so it needs no fitting here: its crown (cast onto the skull, with
// a hem that comes to a point on the forehead), its board, its tassel (the
// cord, the knot and the strands) and its gold band. The home page's Texas
// Tech chapter drops it onto the head (TexasTechProps.tsx), which fetches
// it only once a chapter is showing.
//
// The file, gzipped: a JSON header (length as a Uint32, then the JSON),
// then for each part its positions (Int16 x3, in 1/unit of the head's
// units), normals (Int8 x3, scaled to 127), shade (a Uint8 a point: how
// open to the sky it is, baked in Blender, 255 fully), cloth coordinates
// where it has them (Float32 x2) and triangle indices (Uint16, or Uint32
// for a part of more than 65535 points), each section padded to 4 bytes.

export const CAP_PARTS = ['crown', 'board', 'tassel', 'gold'] as const;
export type CapPart = (typeof CAP_PARTS)[number];
export type Cap = Record<CapPart, BufferGeometry>;

// Imported, so the build serves it under a hashed name with a year's cache.
export const CAP_URL = new URL('./files/cap.bin', import.meta.url).href;

type Part = {
  vertices: number;
  triangles: number;
  position: number;
  normal: number;
  shade: number;
  uv?: number;
  index: number;
};

// The unzipped file as geometries. Each carries its shade as its colour.
export function decodeCap(buffer: ArrayBuffer): Cap {
  const view = new DataView(buffer);
  const length = view.getUint32(0, true);
  const header = JSON.parse(
    new TextDecoder().decode(new Uint8Array(buffer, 4, length)),
  ) as { unit: number; parts: Record<CapPart, Part> };
  const base = 4 + length + ((4 - ((4 + length) % 4)) % 4);
  const part = (each: Part) => {
    const { vertices, triangles } = each;
    const geometry = new BufferGeometry();
    const steps = new Int16Array(buffer, base + each.position, vertices * 3);
    const position = new Float32Array(steps.length);
    for (let k = 0; k < steps.length; k++)
      position[k] = steps[k]! / header.unit;
    geometry.setAttribute('position', new BufferAttribute(position, 3));
    geometry.setAttribute(
      'normal',
      new BufferAttribute(
        new Int8Array(buffer, base + each.normal, vertices * 3),
        3,
        true,
      ),
    );
    const shade = new Uint8Array(buffer, base + each.shade, vertices);
    const color = new Uint8Array(vertices * 3);
    for (let k = 0; k < vertices; k++) color.fill(shade[k]!, k * 3, k * 3 + 3);
    geometry.setAttribute('color', new BufferAttribute(color, 3, true));
    if (each.uv !== undefined)
      geometry.setAttribute(
        'uv',
        new BufferAttribute(
          new Float32Array(buffer, base + each.uv, vertices * 2),
          2,
        ),
      );
    const Indices = vertices > 65535 ? Uint32Array : Uint16Array;
    geometry.setIndex(
      new BufferAttribute(
        new Indices(buffer, base + each.index, triangles * 3),
        1,
      ),
    );
    return geometry;
  };
  return Object.fromEntries(
    CAP_PARTS.map((name) => [name, part(header.parts[name])]),
  ) as Cap;
}

// The file, fetched and unzipped, once. A failed load is not kept, so the
// next call tries again.
let loading: Promise<Cap> | undefined;
export function loadCap(): Promise<Cap> {
  loading ??= new FileLoader()
    .setResponseType('arraybuffer')
    .loadAsync(CAP_URL)
    .then((zipped) =>
      new Response(
        new Blob([zipped as ArrayBuffer])
          .stream()
          .pipeThrough(new DecompressionStream('gzip')),
      ).arrayBuffer(),
    )
    .then(decodeCap)
    .catch((error) => {
      loading = undefined;
      throw error;
    });
  return loading;
}
