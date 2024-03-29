import { useLoader } from '@react-three/fiber';
import { useMemo } from 'react';
import { TextureLoader } from 'three/src/loaders/TextureLoader';

const fragmentShader = `
  uniform sampler2D tMatCap;
  varying vec2 vN;
  void main() {
    vec3 base = texture2D( tMatCap, vN ).rgb;
    gl_FragColor = vec4( base, 1. );
  }
`;

const vertexShader = `
  varying vec2 vN;
  void main() {
    vec3 e = normalize( vec3( modelViewMatrix * vec4( position, 1.0 ) ) );
    vec3 n = normalize( normalMatrix * normal );
    vec3 r = reflect( e, n );
    float m = 2. * sqrt( pow( r.x, 2. ) + pow( r.y, 2. ) + pow( r.z + 1., 2. ) );
    vN = r.xy / m + .5;
    gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1. );
  }
`;

export default function useMatcap(file: string) {
  const value = useLoader(TextureLoader, file);

  return useMemo(
    () => ({
      uniforms: {
        tMatCap: {
          type: 't',
          value,
        },
      },
      fragmentShader,
      vertexShader,
    }),
    [value],
  );
}
