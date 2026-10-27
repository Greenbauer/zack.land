import { FileLoader } from 'three';

// public/background/geometry/head.bin, written by scripts/build-head.mjs: the
// head's meshes and expressions in a compact binary form, gzipped (the site
// serves it as it is, so it is compressed ahead). Unzipped, little-endian:
//
//   'HEAD', u32 version (3), u32 mesh count,
//   f32 min x, y, z, f32 max x, y, z (the box positions are quantized over),
//   u32 expression count, then a 16-byte ASCII name (NUL-padded) for each,
//   per mesh: 16-byte name, u32 vertices, u32 triangles,
//   then per mesh: i16 x, y, z per vertex; u16 a, b, c per triangle;
//   i8 x, y, z unit normal per vertex (times 127), padded to an even byte;
//   u8 head weight per vertex (how much it turns with the head, times 255),
//   padded the same way; then per expression: u32 count of vertices it
//   moves, a u16 index for each, then an i16 x, y, z move for each (in
//   thousandths of a unit).
//
// A position is min + (q + 32768) / 65535 * (max - min) on each axis.

export type HeadMorph = { indices: Uint16Array; moves: Float32Array };

export type HeadMesh = {
  positions: Float32Array;
  normals: Float32Array;
  indices: Uint16Array;
  // 0 to 255 per vertex: how much it turns with the head.
  headWeights: Uint8Array;
  // One per expression, in the file's order.
  morphs: HeadMorph[];
};

export type Head = { meshes: Map<string, HeadMesh>; expressions: string[] };

export const HEAD_URL = '/background/geometry/head.bin';

const text = (buffer: ArrayBuffer, at: number) =>
  String.fromCharCode(...new Uint8Array(buffer, at, 16)).split('\0')[0]!;

export function decodeHead(buffer: ArrayBuffer): Head {
  const view = new DataView(buffer);
  const magic = String.fromCharCode(...new Uint8Array(buffer, 0, 4));
  if (magic !== 'HEAD' || view.getUint32(4, true) !== 3)
    throw new Error('head.bin: not a version 3 head file');
  const count = view.getUint32(8, true);
  const min = [0, 1, 2].map((axis) => view.getFloat32(12 + axis * 4, true));
  const max = [0, 1, 2].map((axis) => view.getFloat32(24 + axis * 4, true));
  const expressions = Array.from({ length: view.getUint32(36, true) }, (_, k) =>
    text(buffer, 40 + k * 16),
  );
  const top = 40 + expressions.length * 16;
  const headers = Array.from({ length: count }, (_, k) => ({
    name: text(buffer, top + k * 24),
    vertices: view.getUint32(top + k * 24 + 16, true),
    triangles: view.getUint32(top + k * 24 + 20, true),
  }));
  const meshes = new Map<string, HeadMesh>();
  let offset = top + count * 24;
  const take = (bytes: number) => {
    const part = buffer.slice(offset, offset + bytes);
    offset += bytes + (bytes % 2);
    return part;
  };
  for (const { name, vertices, triangles } of headers) {
    const quantized = new Int16Array(take(vertices * 6));
    const indices = new Uint16Array(take(triangles * 6));
    const packed = new Int8Array(take(vertices * 3));
    const headWeights = new Uint8Array(take(vertices));
    const morphs = expressions.map(() => {
      const moved = view.getUint32(offset, true);
      offset += 4;
      const at = new Uint16Array(take(moved * 2));
      const moves = Float32Array.from(
        new Int16Array(take(moved * 6)),
        (m) => m / 1000,
      );
      return { indices: at, moves };
    });
    const positions = Float32Array.from(quantized, (q, i) => {
      const axis = i % 3;
      return min[axis]! + ((q + 32768) / 65535) * (max[axis]! - min[axis]!);
    });
    const normals = Float32Array.from(packed, (n) => n / 127);
    meshes.set(name, { positions, normals, indices, headWeights, morphs });
  }
  return { meshes, expressions };
}

// The file, fetched (through three's loader, so the page's loading spinner
// counts it) and unzipped, once.
let loading: Promise<ArrayBuffer> | undefined;
export function loadHead(): Promise<ArrayBuffer> {
  loading ??= new FileLoader()
    .setResponseType('arraybuffer')
    .loadAsync(HEAD_URL)
    .then((zipped) =>
      new Response(
        new Blob([zipped as ArrayBuffer])
          .stream()
          .pipeThrough(new DecompressionStream('gzip')),
      ).arrayBuffer(),
    );
  return loading;
}
