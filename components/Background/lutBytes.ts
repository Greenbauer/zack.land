import {
  ClampToEdgeWrapping,
  Data3DTexture,
  FileLoader,
  LinearFilter,
  Loader,
  UnsignedByteType,
} from 'three';

// The colour grade's table as the page loads it: the bytes three-stdlib's
// LUTCubeLoader makes of scripts/environment/cubicle-99.cube (RGBA, red
// fastest, `size` on a side), written by scripts/build-page-files.mjs, made
// into the same 3D texture, so the page needn't read and parse 885 KB of
// text. Imported, so the build serves it under a hashed name with a year's
// cache.
export const LUT_URL = new URL('./files/cubicle-99.lut', import.meta.url).href;

export class LUTBytesLoader extends Loader<{ texture3D: Data3DTexture }> {
  load(
    url: string,
    onLoad: (_lut: { texture3D: Data3DTexture }) => void,
    onProgress?: (_event: ProgressEvent) => void,
    onError?: (_error: unknown) => void,
  ) {
    new FileLoader(this.manager)
      .setPath(this.path)
      .setResponseType('arraybuffer')
      .load(
        url,
        (bytes) => onLoad(this.parse(bytes as ArrayBuffer)),
        onProgress,
        onError,
      );
  }

  parse(bytes: ArrayBuffer) {
    const data = new Uint8Array(bytes);
    const size = Math.round(Math.cbrt(data.length / 4));
    const texture3D = new Data3DTexture(data, size, size, size);
    texture3D.type = UnsignedByteType;
    texture3D.magFilter = LinearFilter;
    texture3D.minFilter = LinearFilter;
    texture3D.wrapS = ClampToEdgeWrapping;
    texture3D.wrapT = ClampToEdgeWrapping;
    texture3D.wrapR = ClampToEdgeWrapping;
    texture3D.generateMipmaps = false;
    texture3D.needsUpdate = true;
    return { texture3D };
  }
}
