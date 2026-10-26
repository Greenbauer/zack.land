import { Effects } from '@react-three/drei';
import { extend, ThreeElement, useLoader } from '@react-three/fiber';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { LUTCubeLoader, LUTPass } from 'three-stdlib';

extend({ LUTPass, OutputPass });

declare module '@react-three/fiber' {
  interface ThreeElements {
    lUTPass: ThreeElement<typeof LUTPass>;
    outputPass: ThreeElement<typeof OutputPass>;
  }
}

export default function Grading() {
  const { texture3D } = useLoader(
    LUTCubeLoader,
    '/background/environment/cubicle-99.cube',
  );

  // Since three r153 the renderer only tone maps to the screen, so the
  // OutputPass puts back the tone mapping the sandbox (three r148) got for free.
  return (
    <Effects disableGamma>
      <outputPass />
      <lUTPass args={[{ lut: texture3D, intensity: 0.75 }]} />
    </Effects>
  );
}
