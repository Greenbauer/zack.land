import { BufferAttribute, BufferGeometry, FileLoader } from 'three';

// The head's wireframe (StoryProps.tsx) round the seam where the scanned head
// is joined to the body below it. There both were cut by slicing their
// triangles, which left the cut edges crowded with points, so the wireframe
// drew a dense line round the neck. The wireframe draws the skin's own
// triangles everywhere else, and over a band round the seam an even
// retriangulation of the same surface instead (files/wire.bin, written by
// scripts/build-wire.mjs, scripts/head/remesh.mjs), each of whose points is a
// place on one of the skin's triangles, so it moves, turns and bends as the
// skin does there.

// Where the seam lies (JOIN in scripts/build-head.mjs): a slanted line, its
// height at a depth z the height at the back plus `slope` for each unit
// forward. `aboveSeam` is how far a point is above it.
const SEAM = { z: -56, y: -38, slope: (-76 + 38) / (15 + 56) };
export const aboveSeam = (y: number, z: number) =>
  y - (SEAM.y + (z - SEAM.z) * SEAM.slope);
// The band retriangulated, below and above the seam: down to where the haze
// (neckFade.ts) hides its lower border.
export const BAND = [-66, 11] as const;

// Whether each of the skin's triangles is in the band (all its points are),
// for a skin of `positions` (x, y, z in turn) and triangle `index`.
export function inBand(
  positions: ArrayLike<number>,
  index: ArrayLike<number>,
): boolean[] {
  const within = (i: number) => {
    const above = aboveSeam(positions[i * 3 + 1]!, positions[i * 3 + 2]!);
    return above > BAND[0] && above < BAND[1];
  };
  return Array.from({ length: index.length / 3 }, (_, t) =>
    [0, 1, 2].every((k) => within(index[t * 3 + k]!)),
  );
}

export type Patch = {
  // Each point's three skin points, and how much of each (they sum to 1).
  corners: Uint16Array;
  weights: Float32Array;
  index: Uint16Array;
};

// wire.bin, unzipped: u32 points, u32 triangles, then u16 x 3 skin points for
// each point, u16 x 2 for how much of the first two it is (of 65535), and
// u16 x 3 for each triangle.
export function decodePatch(buffer: ArrayBuffer): Patch {
  const [points, triangles] = new Uint32Array(buffer, 0, 2) as unknown as [
    number,
    number,
  ];
  const corners = new Uint16Array(buffer, 8, points * 3);
  const packed = new Uint16Array(buffer, 8 + points * 6, points * 2);
  const weights = new Float32Array(points * 3);
  for (let i = 0; i < points; i++) {
    const [a, b] = [packed[i * 2]! / 65535, packed[i * 2 + 1]! / 65535];
    weights.set([a, b, Math.max(0, 1 - a - b)], i * 3);
  }
  return {
    corners,
    weights,
    index: new Uint16Array(buffer, 8 + points * 10, triangles * 3),
  };
}

// `attribute` of the skin at each of the patch's points.
function onPatch(attribute: BufferAttribute, { corners, weights }: Patch) {
  const { itemSize } = attribute;
  const out = new Float32Array((corners.length / 3) * itemSize);
  for (let i = 0; i < corners.length; i++)
    for (let axis = 0; axis < itemSize; axis++)
      out[Math.floor(i / 3) * itemSize + axis]! +=
        attribute.getComponent(corners[i]!, axis) * weights[i]!;
  return new BufferAttribute(out, itemSize);
}

// The wireframe's two parts: the skin's own points and triangles without the
// band's, and the patch in its place, with its expressions and its turn.
export function wireParts(
  skin: BufferGeometry,
  patch: Patch,
): { rest: BufferGeometry; band: BufferGeometry } {
  const positions = skin.getAttribute('position').array;
  const index = skin.getIndex()!.array;
  const band = inBand(positions, index);
  const rest = new BufferGeometry();
  rest.attributes = skin.attributes;
  rest.morphAttributes = skin.morphAttributes;
  rest.morphTargetsRelative = skin.morphTargetsRelative;
  rest.setIndex(
    new BufferAttribute(
      Uint32Array.from(index).filter((_, i) => !band[Math.floor(i / 3)]),
      1,
    ),
  );
  const even = new BufferGeometry();
  for (const [name, attribute] of Object.entries(skin.attributes))
    even.setAttribute(name, onPatch(attribute as BufferAttribute, patch));
  for (const [name, targets] of Object.entries(skin.morphAttributes))
    even.morphAttributes[name as 'position'] = targets!.map((target) =>
      onPatch(target as BufferAttribute, patch),
    );
  even.morphTargetsRelative = skin.morphTargetsRelative;
  even.setIndex(new BufferAttribute(patch.index, 1));
  return { rest, band: even };
}

// Imported, so the build serves it under a hashed name with a year's cache.
export const WIRE_URL = new URL('./files/wire.bin', import.meta.url).href;

// The file, fetched and unzipped, once. A failed load is not kept, so the
// next call tries again.
let loading: Promise<Patch> | undefined;
export function loadPatch(): Promise<Patch> {
  loading ??= new FileLoader()
    .setResponseType('arraybuffer')
    .loadAsync(WIRE_URL)
    .then((zipped) =>
      new Response(
        new Blob([zipped as ArrayBuffer])
          .stream()
          .pipeThrough(new DecompressionStream('gzip')),
      ).arrayBuffer(),
    )
    .then(decodePatch)
    .catch((error) => {
      loading = undefined;
      throw error;
    });
  return loading;
}
