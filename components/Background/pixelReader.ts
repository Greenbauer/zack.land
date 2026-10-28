// Reads pixels back from the GPU without waiting for it. A plain readPixels
// makes the page stop until the GPU has finished drawing everything asked of
// it so far: on a phone, several milliseconds each time, and the background
// reads the frame many times a second (BackdropSampler.tsx, Grading.tsx,
// TitleName.tsx). Here each read is copied into a buffer on the GPU instead,
// gathered into one buffer (so the page fetches it in one go: in Chrome every
// fetch is a round trip to the GPU's process), and handed back once the GPU
// says it is done: usually a frame or two later.

// A block of the framebuffer, in device pixels from its bottom left.
export type Region = { x: number; y: number; width: number; height: number };

type Pixels = Uint8Array | Float32Array;

// A read's buffer, whether it is floats, and its size: four channels a
// pixel, of four bytes each for floats (so every read is a whole number of
// floats long, and the next starts where a float may).
type Read = { buffer: WebGLBuffer; float: boolean; bytes: number };

type Slot = { buffer: WebGLBuffer; bytes: number };

export class PixelReader {
  private readonly gl: WebGL2RenderingContext;
  // One buffer per read in a batch, and the one they are gathered into,
  // kept for the next batch.
  private readonly buffers: Slot[] = [];
  private gathered: Slot | null = null;
  private reads: Read[] = [];
  private sync: WebGLSync | null = null;
  private done: ((_pixels: Pixels[]) => void) | null = null;

  constructor(gl: WebGL2RenderingContext) {
    this.gl = gl;
  }

  // Whether a batch is on its way: no new one starts until it has arrived.
  get busy() {
    return this.sync !== null;
  }

  // Copies `region` of the framebuffer bound now, as bytes (0 to 255) or,
  // from a float target, floats: four (red, green, blue, alpha) per pixel,
  // rows from the bottom up, as readPixels gives them.
  read(region: Region, float = false) {
    const { gl } = this;
    const bytes = region.width * region.height * 4 * (float ? 4 : 1);
    let slot = this.buffers[this.reads.length];
    if (!slot) {
      slot = { buffer: gl.createBuffer()!, bytes: 0 };
      this.buffers.push(slot);
    }
    gl.bindBuffer(gl.PIXEL_PACK_BUFFER, slot.buffer);
    this.fit(gl.PIXEL_PACK_BUFFER, slot, bytes);
    gl.readPixels(
      region.x,
      region.y,
      region.width,
      region.height,
      gl.RGBA,
      float ? gl.FLOAT : gl.UNSIGNED_BYTE,
      0,
    );
    gl.bindBuffer(gl.PIXEL_PACK_BUFFER, null);
    this.reads.push({ buffer: slot.buffer, float, bytes });
  }

  // Makes `slot`'s buffer, bound at `target`, hold at least `bytes`.
  private fit(target: number, slot: Slot, bytes: number) {
    if (slot.bytes >= bytes) return;
    this.gl.bufferData(target, bytes, this.gl.STREAM_READ);
    slot.bytes = bytes;
  }

  // Closes the batch: `done` gets each read's pixels, in the order read,
  // once they have arrived (from poll). A batch with no reads ends at once.
  send(done: (_pixels: Pixels[]) => void) {
    const { gl } = this;
    if (!this.reads.length) return;
    this.gathered ??= { buffer: gl.createBuffer()!, bytes: 0 };
    gl.bindBuffer(gl.COPY_WRITE_BUFFER, this.gathered.buffer);
    this.fit(gl.COPY_WRITE_BUFFER, this.gathered, this.bytes());
    let offset = 0;
    for (const { buffer, bytes } of this.reads) {
      gl.bindBuffer(gl.COPY_READ_BUFFER, buffer);
      gl.copyBufferSubData(
        gl.COPY_READ_BUFFER,
        gl.COPY_WRITE_BUFFER,
        0,
        offset,
        bytes,
      );
      offset += bytes;
    }
    gl.bindBuffer(gl.COPY_READ_BUFFER, null);
    gl.bindBuffer(gl.COPY_WRITE_BUFFER, null);
    this.sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
    gl.flush();
    this.done = done;
  }

  // Hands an arrived batch to its `done`. Call once a frame.
  poll() {
    const { gl, sync } = this;
    if (!sync || gl.getSyncParameter(sync, gl.SYNC_STATUS) !== gl.SIGNALED)
      return;
    gl.deleteSync(sync);
    const all = new Uint8Array(this.bytes());
    gl.bindBuffer(gl.COPY_READ_BUFFER, this.gathered!.buffer);
    gl.getBufferSubData(gl.COPY_READ_BUFFER, 0, all);
    gl.bindBuffer(gl.COPY_READ_BUFFER, null);
    let offset = 0;
    const pixels = this.reads.map(({ float, bytes }) => {
      const at = offset;
      offset += bytes;
      return float
        ? new Float32Array(all.buffer, at, bytes / 4)
        : all.subarray(at, at + bytes);
    });
    const { done } = this;
    this.reads = [];
    this.sync = null;
    this.done = null;
    done!(pixels);
  }

  // The batch's size, in bytes.
  private bytes() {
    return this.reads.reduce((sum, { bytes }) => sum + bytes, 0);
  }

  dispose() {
    const { gl } = this;
    if (this.sync) gl.deleteSync(this.sync);
    for (const { buffer } of this.buffers) gl.deleteBuffer(buffer);
    if (this.gathered) gl.deleteBuffer(this.gathered.buffer);
    this.buffers.length = 0;
    this.gathered = null;
    this.reads = [];
    this.sync = null;
  }
}
