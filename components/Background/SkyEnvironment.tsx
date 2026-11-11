import { Environment } from '@react-three/drei';
import { useLoader } from '@react-three/fiber';

import { SKY_FILE, SkyLoader } from './skyLoader';

// The sky behind the scene and in its reflections (skyLoader.ts).
export default function SkyEnvironment() {
  const sky = useLoader(SkyLoader, SKY_FILE);
  return (
    <Environment
      map={sky}
      background
      backgroundBlurriness={0.6}
      backgroundIntensity={0.45}
    />
  );
}
