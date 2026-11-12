import { CubeUVReflectionMapping, LinearSRGBColorSpace } from 'three';
import { RGBELoader } from 'three-stdlib';

// The dawn sky (scripts/environment/kiara_1_dawn_1k.hdr) behind the scene,
// blurred, and in the head's and the titles' reflections, already
// prefiltered as three would on the page (scripts/build-environment.mjs):
// there its 256 samples a pixel took a browser drawing WebGL on its CPU (a
// CI runner, a virtual machine) 2 to 15 seconds as the scene first drew,
// with the page's main thread waiting on all of it, the dark screen's own
// cap (READY_AT_MOST_MS, sceneReady.ts) included. The file is three's "cube
// UV" atlas of it, which three uses as it is (SkyEnvironment.tsx).
// Imported, so the build serves it under a hashed name with a year's cache.
export const SKY_FILE = new URL(
  './files/kiara_1_dawn_1k_pmrem.hdr',
  import.meta.url,
).href;

// Loads SKY_FILE as that atlas: RGBE, as the sky itself, read as half floats.
export class SkyLoader extends RGBELoader {
  load(...[url, onLoad, onProgress, onError]: Parameters<RGBELoader['load']>) {
    return super.load(
      url,
      (texture, data) => {
        texture.mapping = CubeUVReflectionMapping;
        texture.colorSpace = LinearSRGBColorSpace;
        onLoad?.(texture, data);
      },
      onProgress,
      onError,
    );
  }
}
