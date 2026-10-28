import { useFrame } from '@react-three/fiber';
import { use, useEffect, useMemo, useRef } from 'react';
import {
  BufferAttribute,
  BufferGeometry,
  Group,
  Material,
  Mesh,
  Raycaster,
  Vector2,
  Vector3,
} from 'three';

import type { MousePosition } from '@/hooks/useMousePosition';

import { Ambient, startAmbient, stepAmbient, withAmbient } from './ambient';
import {
  easeRate,
  easeToward,
  facingSmile,
  pointerExpressions,
  shareOver,
} from './faceExpression';
import { decodeHead, HeadMesh, loadHead } from './headGeometry';
import { headMood, WORRIED } from './headMood';
import { lookOrigin } from './headPlace';
import {
  HeadTaps,
  stepTaps,
  TAP_TURN_SPEED,
  tapExpressions,
  tapHead,
  tapsOn,
  untapped,
} from './headTaps';
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
import { withSides } from './sideMorphs';
import { shownGaze, startWander, stepWander, Wander } from './wander';

export type Point = { x: number; y: number };

type MyHeadGeometry = { [key: string]: BufferGeometry };

type MyHeadProps = {
  // Where the pointer has the head look, now.
  lookPositionStart: () => Point;
  // The pointer (useMousePosition): the head clears `moved` once it has
  // seen the move.
  pointer: MousePosition;
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

// Before it first wanders off on its own, the head faces the camera and looks
// surprised (idleGreeting.ts).
let greeting: Greeting = idle;
// Below this every expression counts as eased out: a neutral face.
const NEUTRAL = 0.02;
// How long the page has to be left alone (no pointer move, scroll, press or
// key: useMousePosition) before the head greets and then looks around on its
// own, in seconds: somewhere in this range, picked afresh each time.
const IDLE_SECONDS = [10, 15] as const;
const idleWait = () =>
  IDLE_SECONDS[0] + Math.random() * (IDLE_SECONDS[1] - IDLE_SECONDS[0]);
// How quickly the sky follows the head while it looks around on its own: a
// share each frame, so it trails behind the head's glances.
const WANDER_SKY_SPEED = 0.01;
// A tap on any of these is meant for the page, not the head.
const PAGE_TARGETS =
  'a, button, input, textarea, select, label, section, header, footer, [data-glass]';

export default function MyHead({ lookPositionStart, pointer }: MyHeadProps) {
  const myHeadRef = useRef<Group>(null);
  // Where the head is looking: x tips it, y turns it (radians).
  const look = useRef({ x: 0, y: 0 });
  const myHeadFile = use(loadHead());
  const skinRef = useRef<Mesh>(null);
  const mouthRef = useRef<Mesh>(null);

  const { geometry: myHeadGeometry, expressions } = useMemo(() => {
    // With one-sided brows and squints (sideMorphs.ts) for ambient.ts.
    const { meshes, expressions } = withSides(decodeHead(myHeadFile));
    const geometry: MyHeadGeometry = {};
    for (const [name, part] of meshes) geometry[name] = headGeometry(part);
    return { geometry, expressions };
  }, [myHeadFile]);
  // Each expression's strength now, eased toward what the look calls for.
  const strengths = useRef<number[]>([]);
  // On a touch screen: the head looks around on its own, and reacts to taps
  // on it (headTaps.ts). A tap waits here until the next frame tests it
  // against the head.
  const isTouch = useMemo(
    () => typeof window !== 'undefined' && matchMedia('(hover: none)').matches,
    [],
  );
  const taps = useRef<HeadTaps>(untapped);
  // Looking around on its own (wander.ts), and when the page was last used.
  const wandering = useRef<Wander | null>(null);
  const idleSince = useRef(0);
  const idleFor = useRef(idleWait());
  // The little tilts and faint expressions it makes on its own (ambient.ts).
  const ambient = useRef<Ambient>(startAmbient(0));
  const tapAt = useRef<Point | null>(null);
  const raycaster = useMemo(() => new Raycaster(), []);

  useEffect(() => {
    if (!isTouch) return;
    const onTap = (event: MouseEvent) => {
      if ((event.target as Element | null)?.closest(PAGE_TARGETS)) return;
      tapAt.current = { x: event.clientX, y: event.clientY };
    };
    addEventListener('click', onTap);
    return () => removeEventListener('click', onTap);
  }, [isTouch]);

  const lookPositionLimit = (
    coordinate: number,
    min: number,
    max: number,
  ): number => {
    if (coordinate > max) return max;
    if (coordinate < min) return min;
    return coordinate;
  };

  // Someone used the page: stop looking around, and start the idle clock.
  const stopWandering = (time: number): void => {
    wandering.current = null;
    idleSince.current = time;
    idleFor.current = idleWait();
    pointer.moved = false;
  };

  const startWandering = (time: number): void => {
    wandering.current = startWander(look.current, time);
  };

  // On a touch screen there is no pointer to follow (a tap's emulated
  // mousemove is not one), so the head looks around from the start; while a
  // tap's reaction is under way it faces the camera instead. Returns whether
  // it is reacting.
  const stepTouch = (time: number): boolean => {
    if (!isTouch) return false;
    pointer.moved = false;
    if (!tapsOn(taps.current)) {
      if (!wandering.current) startWandering(time);
      return false;
    }
    taps.current = stepTaps(taps.current, time);
    if (!tapsOn(taps.current)) startWandering(time);
    return true;
  };

  const rotateMyHead = (time: number, seconds: number): void => {
    const { rotation } = myHeadRef.current!;
    const turn = look.current;
    let lookPosition: Point = lookPositionStart();
    let rotationSpeed: number = 0.05;
    let skySpeed: number | undefined;

    if (stepTouch(time)) {
      lookPosition = { x: 0, y: 0 };
      rotationSpeed = TAP_TURN_SPEED;
    } else if (pointer.moved) {
      stopWandering(time);
      greeting = idle;
    } else if (greetingOn(greeting)) {
      lookPosition = { x: 0, y: 0 };
      greeting = stepGreeting(greeting, {
        turn,
        // Every expression eased out (the strengths are the last frame's).
        neutral: strengths.current.every((s) => s < NEUTRAL),
        time,
      });
      if (greeting.phase === 'done') startWandering(time);
    } else if (wandering.current) {
      // Looking around on its own: the wander's gaze is already smooth, so
      // the head takes it as it is (in the pointer's units, x the turn).
      wandering.current = stepWander(wandering.current, time, seconds);
      const gaze = shownGaze(wandering.current, time);
      lookPosition = { x: gaze.y * 1000, y: gaze.x * 1000 };
      rotationSpeed = 1;
      skySpeed = WANDER_SKY_SPEED;
    } else if (
      time - idleSince.current > idleFor.current &&
      greeting.phase === 'idle'
    ) {
      greeting = { phase: 'facing' };
    }

    heading.target = lookPosition;
    heading.speed = skySpeed ?? rotationSpeed;

    lookPosition = {
      x: lookPositionLimit(lookPosition.x * 0.001, -0.5, 0.3),
      y: lookPositionLimit(lookPosition.y * 0.001, -0.15, 0.13),
    };

    const share = shareOver(rotationSpeed, seconds);
    turn.x += share * (lookPosition.y - turn.x);
    turn.y += share * (lookPosition.x - turn.y);
    const { body, head } = splitLook(turn);
    rotation.set(body.x, body.y, 0);
    ambient.current = stepAmbient(ambient.current, turn, time, seconds);
    headTurn.value.set(head.x, head.y, ambient.current.tilt);
  };

  useFrame(({ clock, camera, size }, delta) => {
    fadeTime.value = clock.elapsedTime;
    // A tap that lands on the head (its skin, as posed this frame) sets off
    // the next reaction.
    if (tapAt.current && skinRef.current) {
      const { x, y } = tapAt.current;
      tapAt.current = null;
      raycaster.setFromCamera(
        new Vector2((x / size.width) * 2 - 1, 1 - (y / size.height) * 2),
        camera,
      );
      if (raycaster.intersectObject(skinRef.current, false).length) {
        taps.current = tapHead(taps.current, clock.elapsedTime);
        wandering.current = null;
      }
    }
    rotateMyHead(clock.elapsedTime, delta);
    // Where the head is looking, back in screen pixels (index.tsx measures
    // the look from lookOrigin across and halfway down), against where the
    // eyes are on screen.
    const spot = {
      x: heading.target.x * 2 + lookOrigin(size.width),
      y: heading.target.y * 2 + size.height / 2,
    };
    const eyes = myHeadRef.current!.localToWorld(EYES.clone()).project(camera);
    // A tap's reaction, or the greeting (no expression while the head turns
    // to the camera, then the gasp, then the smile), each eased in quickly;
    // otherwise the face reacts to where it is looking.
    const isTapped = tapsOn(taps.current);
    const isGreeting = isTapped || greetingOn(greeting);
    // A page holding the face (the 404 page, headMood) sets it worried,
    // while the head still moves as it would.
    const targets: Record<string, number> = isTapped
      ? tapExpressions(taps.current)
      : headMood.worried
        ? WORRIED
        : greetingOn(greeting)
          ? greetingExpressions(greeting)
          : // The face's reactions to where it looks, with a faint
            // expression of its own now and then (ambient.ts).
            withAmbient(
              {
                smile: facingSmile(look.current),
                ...pointerExpressions(
                  spot,
                  {
                    x: ((eyes.x + 1) / 2) * size.width,
                    y: ((1 - eyes.y) / 2) * size.height,
                  },
                  size,
                ),
              },
              ambient.current,
              clock.elapsedTime,
            );
    strengths.current = expressions.map((name, k) =>
      easeToward(
        strengths.current[k] ?? 0,
        targets[name] ?? 0,
        delta,
        isGreeting ? GREETING_EASE_RATE : easeRate(name, look.current),
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
