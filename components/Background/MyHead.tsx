import { useFrame } from '@react-three/fiber';
import { use, useMemo, useRef } from 'react';
import {
  BufferAttribute,
  BufferGeometry,
  Group,
  Material,
  Mesh,
  Vector3,
} from 'three';

import {
  easeToward,
  facingSmile,
  pointerExpressions,
  shareOver,
} from './faceExpression';
import { decodeHead, HeadMesh, loadHead } from './headGeometry';
import { headTurn, turnHead } from './headTurn';
import {
  Greeting,
  GREETING_EASE_RATE,
  greetingExpressions,
  greetingOn,
  idle,
  stepGreeting,
} from './idleGreeting';
import { fadeNeck, fadeTime } from './neckFade';

export type Point = { x: number; y: number };

type MyHeadGeometry = { [key: string]: BufferGeometry };

type MyHeadProps = {
  lookPositionStart: Point;
};

// The look of pmndrs' "Color grading" sandbox (codesandbox.io/p/sandbox/wvgxp):
// its terrazzo sphere's black base without the flakes, and eyes in its
// lightest flake color.
export const SKIN_COLOR = '#000000';
// The mouth's inside: flat black, so it shows no detail.
const MOUTH_COLOR = '#000000';
const EYE_COLOR = '#aca8a3';
export const GLOSS = {
  clearcoat: 0.6,
  clearcoatRoughness: 0.1,
  roughness: 0.22,
  metalness: 0.25,
};

// The shoulders stay still, turned this far (radians) in toward the middle of
// the page; the head and neck do all the turning, so where the head looks is
// unchanged and the neck twists between it and the shoulders.
export const BODY_TURN = 0.25;

// The look (x tips, y turns, radians) split into the body's fixed turn and
// the head's turn on the neck relative to it.
export const splitLook = (look: { x: number; y: number }) => ({
  body: { x: 0, y: BODY_TURN },
  head: { x: look.x, y: look.y - BODY_TURN },
});

const skinShader: Material['onBeforeCompile'] = (shader) => {
  turnHead(shader);
  fadeNeck(shader);
};

// The point between the eyes, in head.bin units.
const EYES = new Vector3(-0.7, 2.7, 29.3);

// Where the head is heading this frame, in the same pointer units as
// lookPositionStart, and how fast it eases there. The sky follows it too.
export const heading = { target: { x: 0, y: 0 }, speed: 0.05 };

// A mesh's geometry, with each expression as a morph target (its moves, and
// the turn of each normal they cause, worked out here once).
function headGeometry(part: HeadMesh): BufferGeometry {
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new BufferAttribute(part.positions, 3));
  geometry.setAttribute('normal', new BufferAttribute(part.normals, 3));
  geometry.setIndex(new BufferAttribute(part.indices, 1));
  geometry.setAttribute(
    'headWeight',
    new BufferAttribute(part.headWeights, 1, true),
  );
  if (part.morphs.some((morph) => morph.indices.length)) {
    const normalsOf = (positions: Float32Array) => {
      const shape = new BufferGeometry();
      shape.setAttribute('position', new BufferAttribute(positions, 3));
      shape.setIndex(new BufferAttribute(part.indices, 1));
      shape.computeVertexNormals();
      return shape.getAttribute('normal').array as Float32Array;
    };
    const rest = normalsOf(part.positions);
    const moves = part.morphs.map(({ indices, moves: sparse }) => {
      const dense = new Float32Array(part.positions.length);
      indices.forEach((v, k) =>
        dense.set(sparse.subarray(k * 3, k * 3 + 3), v * 3),
      );
      return dense;
    });
    geometry.morphAttributes.position = moves.map(
      (dense) => new BufferAttribute(dense, 3),
    );
    geometry.morphAttributes.normal = moves.map((dense) => {
      const posed = normalsOf(part.positions.map((c, i) => c + dense[i]!));
      return new BufferAttribute(
        posed.map((c, i) => c - rest[i]!),
        3,
      );
    });
    geometry.morphTargetsRelative = true;
  }
  return geometry;
}

let frameCount: number = 0;
let frameCountLimit: number = 300;
let isFrameCounting: boolean = false;
let randomPosition: Point = { x: 0, y: 0 };
// Before it first wanders off on its own, the head faces the camera and looks
// surprised (idleGreeting.ts).
let greeting: Greeting = idle;
// Below this every expression counts as eased out: a neutral face.
const NEUTRAL = 0.02;

export default function MyHead({ lookPositionStart }: MyHeadProps) {
  let isMouseMoving = true;
  const myHeadRef = useRef<Group>(null);
  // Where the head is looking: x tips it, y turns it (radians).
  const look = useRef({ x: 0, y: 0 });
  const myHeadFile = use(loadHead());
  const skinRef = useRef<Mesh>(null);
  const mouthRef = useRef<Mesh>(null);

  const { geometry: myHeadGeometry, expressions } = useMemo(() => {
    const { meshes, expressions } = decodeHead(myHeadFile);
    const geometry: MyHeadGeometry = {};
    for (const [name, part] of meshes) geometry[name] = headGeometry(part);
    return { geometry, expressions };
  }, [myHeadFile]);
  // Each expression's strength now, eased toward what the look calls for.
  const strengths = useRef<number[]>([]);

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

  const rotateMyHead = (time: number, seconds: number): void => {
    const { rotation } = myHeadRef.current!;
    const turn = look.current;
    let lookPosition: Point = lookPositionStart;
    let rotationSpeed: number = 0.05;

    if (isMouseMoving) {
      stopRandomRotation();
      greeting = idle;
    } else if (greetingOn(greeting)) {
      lookPosition = { x: 0, y: 0 };
      greeting = stepGreeting(greeting, {
        turn,
        // Every expression eased out (the strengths are the last frame's).
        neutral: strengths.current.every((s) => s < NEUTRAL),
        time,
      });
      if (greeting.phase === 'done') startRandomRotation();
    } else {
      if (isFrameCounting) {
        lookPosition = randomPosition;
        rotationSpeed = 0.01;
      }

      frameCount += 1;

      if (frameCount > frameCountLimit) {
        if (!isFrameCounting && greeting.phase === 'idle')
          greeting = { phase: 'facing' };
        else startRandomRotation();
      }
    }

    heading.target = lookPosition;
    heading.speed = rotationSpeed;

    lookPosition = {
      x: lookPositionLimit(lookPosition.x * 0.001, -0.5, 0.3),
      y: lookPositionLimit(lookPosition.y * 0.001, -0.15, 0.13),
    };

    const share = shareOver(rotationSpeed, seconds);
    turn.x += share * (lookPosition.y - turn.x);
    turn.y += share * (lookPosition.x - turn.y);
    const { body, head } = splitLook(turn);
    rotation.set(body.x, body.y, 0);
    headTurn.value.set(head.x, head.y);
  };

  useFrame(({ clock, camera, size }, delta) => {
    fadeTime.value = clock.elapsedTime;
    rotateMyHead(clock.elapsedTime, delta);
    // Where the head is looking, back in screen pixels (index.tsx measures
    // the look from a third of the way across and halfway down), against
    // where the eyes are on screen.
    const spot = {
      x: heading.target.x * 2 + size.width / 3,
      y: heading.target.y * 2 + size.height / 2,
    };
    const eyes = myHeadRef.current!.localToWorld(EYES.clone()).project(camera);
    // Greeting: no expression while the head turns to the camera, then the
    // gasp, then the smile, each eased in quickly; otherwise the face reacts
    // to where it is looking.
    const isGreeting = greetingOn(greeting);
    const targets: Record<string, number> = isGreeting
      ? greetingExpressions(greeting)
      : {
          smile: facingSmile(look.current),
          ...pointerExpressions(
            spot,
            {
              x: ((eyes.x + 1) / 2) * size.width,
              y: ((1 - eyes.y) / 2) * size.height,
            },
            size,
          ),
        };
    strengths.current = expressions.map((name, k) =>
      easeToward(
        strengths.current[k] ?? 0,
        targets[name] ?? 0,
        delta,
        isGreeting ? GREETING_EASE_RATE : undefined,
      ),
    );
    for (const mesh of [skinRef.current, mouthRef.current])
      if (mesh) mesh.morphTargetInfluences = strengths.current;
  });

  return (
    <group position={[0, 5, 0]} ref={myHeadRef}>
      <mesh geometry={myHeadGeometry.skin} ref={skinRef}>
        <meshPhysicalMaterial
          color={SKIN_COLOR}
          {...GLOSS}
          transparent
          onBeforeCompile={skinShader}
        />
      </mesh>
      <mesh geometry={myHeadGeometry.mouth} ref={mouthRef}>
        <meshBasicMaterial color={MOUTH_COLOR} onBeforeCompile={turnHead} />
      </mesh>
      <mesh geometry={myHeadGeometry.rightEye}>
        <meshPhysicalMaterial
          color={EYE_COLOR}
          {...GLOSS}
          onBeforeCompile={turnHead}
        />
      </mesh>
      <mesh geometry={myHeadGeometry.leftEye}>
        <meshPhysicalMaterial
          color={EYE_COLOR}
          {...GLOSS}
          onBeforeCompile={turnHead}
        />
      </mesh>
    </group>
  );
}
