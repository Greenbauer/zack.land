import { describe, expect, it } from 'vitest';

import { PixelReader } from './pixelReader';

// A stand-in for WebGL2: a framebuffer whose every channel is `fill()`,
// buffers that keep what is copied into them, and a fence the test signals.
function fakeGl(fill: () => number) {
  type Buffer = { data: Uint8Array };
  const PIXEL_PACK_BUFFER = 1;
  const COPY_READ_BUFFER = 2;
  const COPY_WRITE_BUFFER = 3;
  const SIGNALED = 4;
  const SYNC_STATUS = 5;
  const FLOAT = 6;
  const bound = new Map<number, Buffer | null>();
  const at = (target: number) => bound.get(target)!;
  const fence = { signaled: false };
  const calls = { sync: 0, fetches: 0 };
  const gl = {
    PIXEL_PACK_BUFFER,
    COPY_READ_BUFFER,
    COPY_WRITE_BUFFER,
    SIGNALED,
    SYNC_STATUS,
    FLOAT,
    RGBA: 0,
    UNSIGNED_BYTE: 7,
    STREAM_READ: 0,
    STREAM_COPY: 0,
    SYNC_GPU_COMMANDS_COMPLETE: 0,
    createBuffer: (): Buffer => ({ data: new Uint8Array(0) }),
    bindBuffer: (target: number, buffer: Buffer | null) =>
      bound.set(target, buffer),
    bufferData: (target: number, bytes: number) => {
      at(target).data = new Uint8Array(bytes);
    },
    readPixels: (
      _x: number,
      _y: number,
      width: number,
      height: number,
      _format: number,
      type: number,
      offset: number,
    ) => {
      // Only reads into a buffer: never one the page waits on.
      expect(offset).toBe(0);
      const values = Array.from({ length: width * height * 4 }, fill);
      const bytes =
        type === FLOAT
          ? new Uint8Array(new Float32Array(values).buffer)
          : new Uint8Array(values);
      at(PIXEL_PACK_BUFFER).data.set(bytes);
    },
    copyBufferSubData: (
      from: number,
      to: number,
      fromOffset: number,
      toOffset: number,
      bytes: number,
    ) =>
      at(to).data.set(
        at(from).data.subarray(fromOffset, fromOffset + bytes),
        toOffset,
      ),
    fenceSync: () => {
      calls.sync++;
      fence.signaled = false;
      return fence;
    },
    flush: () => {},
    getSyncParameter: (sync: typeof fence) =>
      sync.signaled ? SIGNALED : SYNC_STATUS,
    deleteSync: () => {},
    deleteBuffer: () => {},
    getBufferSubData: (target: number, offset: number, out: Uint8Array) => {
      calls.fetches++;
      out.set(at(target).data.subarray(offset, offset + out.length));
    },
  };
  return { gl: gl as unknown as WebGL2RenderingContext, fence, calls };
}

describe('reading pixels without waiting on the GPU', () => {
  it('hands back nothing until the GPU has finished, then every read in order', () => {
    let value = 0;
    const { gl, fence, calls } = fakeGl(() => value);
    const reader = new PixelReader(gl);
    const got: number[][] = [];
    value = 10;
    reader.read({ x: 0, y: 0, width: 1, height: 1 });
    value = 20;
    reader.read({ x: 5, y: 5, width: 2, height: 1 });
    reader.send((pixels) => got.push(...pixels.map((p) => [...p])));
    expect(reader.busy).toBe(true);
    reader.poll();
    expect(got).toEqual([]);
    fence.signaled = true;
    reader.poll();
    expect(got).toEqual([
      [10, 10, 10, 10],
      [20, 20, 20, 20, 20, 20, 20, 20],
    ]);
    // Fetched from the GPU in one go.
    expect(calls.fetches).toBe(1);
    expect(reader.busy).toBe(false);
  });

  it('reads floats from a float target as floats, beside bytes', () => {
    let value = 0;
    const { gl, fence } = fakeGl(() => value);
    const reader = new PixelReader(gl);
    let got: (Float32Array | Uint8Array)[] = [];
    value = 7;
    reader.read({ x: 0, y: 0, width: 1, height: 1 });
    value = 0.25;
    reader.read({ x: 0, y: 0, width: 2, height: 1 }, true);
    reader.send((pixels) => {
      got = pixels;
    });
    fence.signaled = true;
    reader.poll();
    expect(got[0]).toBeInstanceOf(Uint8Array);
    expect([...got[0]!]).toEqual([7, 7, 7, 7]);
    expect(got[1]).toBeInstanceOf(Float32Array);
    expect([...got[1]!]).toEqual(Array(8).fill(0.25));
  });

  it('starts no batch for no reads', () => {
    const { gl, calls } = fakeGl(() => 0);
    const reader = new PixelReader(gl);
    reader.send(() => {
      throw new Error('a batch of nothing was delivered');
    });
    expect(reader.busy).toBe(false);
    expect(calls.sync).toBe(0);
    reader.poll();
  });

  it('reuses its buffers from one batch to the next', () => {
    const { gl, fence } = fakeGl(() => 1);
    let made = 0;
    const createBuffer = gl.createBuffer.bind(gl);
    gl.createBuffer = () => {
      made++;
      return createBuffer();
    };
    const reader = new PixelReader(gl);
    for (let batch = 0; batch < 3; batch++) {
      reader.read({ x: 0, y: 0, width: 1, height: 1 });
      reader.read({ x: 0, y: 0, width: 1, height: 1 });
      reader.send(() => {});
      fence.signaled = true;
      reader.poll();
    }
    // One a read, and the one they are gathered into.
    expect(made).toBe(3);
  });
});
