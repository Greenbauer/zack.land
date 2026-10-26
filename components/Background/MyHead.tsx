import { useFrame, useLoader } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import { BufferGeometry, Group, Mesh } from 'three';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';

export type Point = { x: number; y: number };

type MyHeadGeometry = { [key: string]: BufferGeometry };

type MyHeadProps = {
  lookPositionStart: Point;
};

// The look of pmndrs' "Color grading" sandbox (codesandbox.io/p/sandbox/wvgxp):
// its terrazzo sphere's black base without the flakes, and eyes in its
// lightest flake color.
const SKIN_COLOR = '#000000';
const EYE_COLOR = '#aca8a3';
const GLOSS = {
  clearcoat: 1,
  clearcoatRoughness: 0,
  roughness: 0,
  metalness: 0.5,
};

let frameCount: number = 0;
let frameCountLimit: number = 300;
let isFrameCounting: boolean = false;
let randomPosition: Point = { x: 0, y: 0 };

export default function MyHead({ lookPositionStart }: MyHeadProps) {
  let isMouseMoving = true;
  const myHeadRef = useRef<Group>(null);
  const myHeadObj = useLoader(OBJLoader, '/background/geometry/myHead.obj');

  const myHeadGeometry: MyHeadGeometry = useMemo(() => {
    const geometry: MyHeadGeometry = {};
    myHeadObj.traverse((child) => {
      if (child instanceof Mesh) {
        geometry[child.name] = child.geometry;
      }
    });

    return geometry;
  }, [myHeadObj]);

  const lookPositionLimit = (
    coordinate: number,
    min: number,
    max: number,
  ): number => {
    if (coordinate > max) return max;
    if (coordinate < min) return min;
    return coordinate;
  };

  const stopRandomRotation = (): void => {
    frameCount = 0;
    isMouseMoving = false;
    isFrameCounting = false;
  };

  const startRandomRotation = (): void => {
    const randomNumber = (min: number, max: number) => {
      return Math.floor(Math.random() * (max - min)) + min;
    };

    frameCount = 0;
    frameCountLimit = randomNumber(300, 800);
    isFrameCounting = true;
    randomPosition = {
      x: randomNumber(1200, -2000),
      y: randomNumber(520, -600),
    };
  };

  const rotateMyHead = (): void => {
    const { rotation } = myHeadRef.current!;
    let lookPosition: Point = lookPositionStart;
    let rotationSpeed: number = 0.05;

    if (isMouseMoving) {
      stopRandomRotation();
    } else {
      if (isFrameCounting) {
        lookPosition = randomPosition;
        rotationSpeed = 0.01;
      }

      frameCount += 1;

      if (frameCount > frameCountLimit) {
        startRandomRotation();
      }
    }

    lookPosition = {
      x: lookPositionLimit(lookPosition.x * 0.001, -0.5, 0.3),
      y: lookPositionLimit(lookPosition.y * 0.001, -0.15, 0.13),
    };

    rotation.x += rotationSpeed * (lookPosition.y - rotation.x);
    rotation.y += rotationSpeed * (lookPosition.x - rotation.y);
  };

  useFrame(() => {
    rotateMyHead();
  });

  return (
    <group position={[0, 5, 0]} ref={myHeadRef}>
      <mesh geometry={myHeadGeometry.skin}>
        <meshPhysicalMaterial color={SKIN_COLOR} {...GLOSS} />
      </mesh>
      <mesh geometry={myHeadGeometry.rightEye}>
        <meshPhysicalMaterial color={EYE_COLOR} {...GLOSS} />
      </mesh>
      <mesh geometry={myHeadGeometry.leftEye}>
        <meshPhysicalMaterial color={EYE_COLOR} {...GLOSS} />
      </mesh>
    </group>
  );
}
