import { useFrame } from '@react-three/fiber';
import { use, useEffect, useMemo, useRef } from 'react';
import {
  BufferGeometry,
  Group,
  Material,
  Mesh,
  Raycaster,
  Vector2,
  Vector3,
} from 'three';

import type { MousePosition } from '@/hooks/useMousePosition';

import {
  Ambient,
  ambientFace,
  holdFace,
  startAmbient,
  stepAmbient,
  withFace,
} from './ambient';
import { blinkAmount, startBlink, stepBlink } from './blink';
import { easeRate, easeToward, shareOver } from './faceExpression';
import { faceTargets } from './headFace';
import { decodeHead, loadHead } from './headGeometry';
import { headMood } from './headMood';
import { lookOrigin } from './headPlace';
import { Search, searchOver, startSearch, stepSearch } from './headSearch';
import {
  HeadTaps,
  onHead,
  stepTaps,
  TAP_TURN_SPEED,
  tapHead,
  tapsOn,
  untapped,
} from './headTaps';
import { headTurn, turnHead } from './headTurn';
import {
  faceNeutral,
  Greeting,
  GREETING_EASE_RATE,
  greetingOn,
  idle,
  idleStart,
  stepGreeting,
} from './idleGreeting';
import { morphGeometry } from './morphGeometry';
import { fadeNeck, fadeTime } from './neckFade';
import { neckExpressions } from './neckPose';
import { faceInView, idleWait, PAGE_TARGETS } from './pageWatch';
import { SHOWN_EXPRESSIONS, SHOWN_SIDED } from './shownExpressions';
import { withSides } from './sideMorphs';
import {
  shownGaze,
  startWander,
  stepWander,
  TIP,
  TURN,
  Wander,
  WANDER_TURN,
} from './wander';

export type Point = { x: number; y: number };
// Where the head is to look (in the pointer's units, as lookPositionStart),
// how fast it turns there, and how fast the sky follows (the turn's pace
// unless given).
type Heading = {
  lookPosition: Point;
  rotationSpeed: number;
  skySpeed?: number;
};
// A look in radians (x tips, y turns) in the pointer's units, x the turn.
const asPosition = (gaze: Point): Point => ({
  x: gaze.y * 1000,
  y: gaze.x * 1000,
});

type MyHeadGeometry = { [key: string]: BufferGeometry };

type MyHeadProps = {
  // Where the pointer has the head look, now.
  lookPositionStart: () => Point;
  // The pointer (useMousePosition): the head clears `moved` and `left` once
  // it has seen them.
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

// Before it first wanders off on its own, the head faces the camera and looks
// surprised (idleGreeting.ts).
let greeting: Greeting = idle;
// How quickly the sky follows the head while it looks around on its own: a
// share each frame, so it trails behind the head's glances.
const WANDER_SKY_SPEED = 0.01;

export default function MyHead({ lookPositionStart, pointer }: MyHeadProps) {
  const myHeadRef = useRef<Group>(null);
  // Where the head is looking: x tips it, y turns it (radians).
  const look = useRef({ x: 0, y: 0 });
  const myHeadFile = use(loadHead());
  const skinRef = useRef<Mesh>(null);
  const mouthRef = useRef<Mesh>(null);

  const { geometry: myHeadGeometry, expressions } = useMemo(() => {
    // The expressions the page shows (shownExpressions.ts), with one-sided
    // brows and squints (sideMorphs.ts) for ambient.ts.
    const { meshes, expressions } = withSides(
      decodeHead(myHeadFile, SHOWN_EXPRESSIONS),
      SHOWN_SIDED,
    );
    const geometry: MyHeadGeometry = {};
    for (const [name, part] of meshes) geometry[name] = morphGeometry(part);
    return { geometry, expressions };
  }, [myHeadFile]);
  // Each expression's strength now, eased toward what the look calls for.
  const strengths = useRef<number[]>([]);
  // The blinks' clock (blink.ts), and where the head looked last frame.
  const blink = useRef(startBlink(0));
  const lastLook = useRef({ x: 0, y: 0 });
  // The passing look laid over the face (ambient.ts), not eased: it has its
  // own quick onset and offset. When the greeting or a tap takes the face, it
  // eases out.
  const face = useRef<Record<string, number>>({});
  // On a touch screen the head looks around on its own. On any screen it
  // reacts to taps or clicks on its face (headTaps.ts); one waits here until
  // the next frame tests it against the head.
  const isTouch = useMemo(
    () => typeof window !== 'undefined' && matchMedia('(hover: none)').matches,
    [],
  );
  const taps = useRef<HeadTaps>(untapped);
  // Looking around on its own (wander.ts), and when the page was last used.
  const wandering = useRef<Wander | null>(null);
  const idleSince = useRef(0);
  // When the last frame was drawn (none are while the tab is hidden).
  const lastFrame = useRef(0);
  const idleFor = useRef(idleWait());
  // The little tilts and faint expressions it makes on its own (ambient.ts).
  const ambient = useRef<Ambient>(startAmbient(0));
  // Looking for the pointer it lost (headSearch.ts): once each time it is
  // left alone, and then the look it gave up on, held.
  const search = useRef<Search | null>(null);
  const searched = useRef(false);
  const gaveUp = useRef<Point | null>(null);
  const tapAt = useRef<Point | null>(null);
  const raycaster = useMemo(() => new Raycaster(), []);

  useEffect(() => {
    const onTap = (event: MouseEvent) => {
      if ((event.target as Element | null)?.closest(PAGE_TARGETS)) return;
      tapAt.current = { x: event.clientX, y: event.clientY };
    };
    addEventListener('click', onTap);
    return () => removeEventListener('click', onTap);
  }, []);

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
    search.current = null;
    searched.current = false;
    gaveUp.current = null;
    idleSince.current = time;
    idleFor.current = idleWait();
    pointer.moved = false;
    pointer.left = false;
  };

  // While the face can't be seen clearly there is no greeting, and its clock
  // only counts the time it can, never time away from the page (idleStart).
  const holdWhileUnseen = (time: number): void => {
    const seen = isTouch || faceInView();
    idleSince.current = idleStart(idleSince.current, {
      time,
      lastFrame: lastFrame.current,
      seen,
    });
    lastFrame.current = time;
    if (!seen && greetingOn(greeting)) greeting = idle;
  };

  const startWandering = (time: number): void => {
    wandering.current = startWander(look.current, time);
  };

  // On a touch screen there is no pointer to follow (a tap's emulated
  // mousemove is not one), so the head looks around from the start. While a
  // tap's or a click's reaction is under way it faces the camera instead;
  // after it, on a touch screen it looks around again, and with a mouse it
  // follows the pointer, the idle clock starting over. Returns whether it is
  // reacting.
  const stepReaction = (time: number): boolean => {
    if (isTouch) pointer.moved = false;
    if (!tapsOn(taps.current)) {
      if (isTouch && !wandering.current) startWandering(time);
      return false;
    }
    taps.current = stepTaps(taps.current, time);
    if (!tapsOn(taps.current)) {
      if (isTouch) startWandering(time);
      else stopWandering(time);
    }
    return true;
  };

  // The greeting's next step, the head facing the camera.
  const greet = (time: number): Heading => {
    greeting = stepGreeting(greeting, {
      turn: look.current,
      // Every expression eased out (the strengths are the last frame's).
      neutral: faceNeutral(
        withFace(
          Object.fromEntries(
            expressions.map((name, k) => [name, strengths.current[k] ?? 0]),
          ),
          face.current,
        ),
      ),
      time,
    });
    if (greeting.phase === 'done') startWandering(time);
    return { lookPosition: { x: 0, y: 0 }, rotationSpeed: 0.05 };
  };

  // Left alone: once the idle clock runs out, the greeting, then looking
  // around on its own. Before the greeting, and as soon as the pointer goes
  // out of the window, it looks for the pointer it lost, then holds the look
  // it gave up on. Null while it still follows the pointer.
  const stepLeftAlone = (time: number, seconds: number): Heading | null => {
    if (greetingOn(greeting)) return greet(time);
    if (wandering.current) {
      // Looking around on its own: the wander's gaze is already smooth, so
      // the head takes it as it is.
      wandering.current = stepWander(wandering.current, time, seconds);
      return {
        lookPosition: asPosition(shownGaze(wandering.current, time)),
        rotationSpeed: 1,
        skySpeed: WANDER_SKY_SPEED,
      };
    }
    const due =
      time - idleSince.current > idleFor.current && greeting.phase === 'idle';
    if (!searched.current && (pointer.left || due)) {
      search.current = startSearch(look.current, time);
      searched.current = true;
    }
    if (search.current) {
      search.current = stepSearch(search.current, time, seconds);
      gaveUp.current = search.current.gaze;
      if (!searchOver(search.current))
        return { lookPosition: asPosition(gaveUp.current), rotationSpeed: 1 };
      search.current = null;
    }
    if (due) greeting = { phase: 'facing' };
    return gaveUp.current
      ? { lookPosition: asPosition(gaveUp.current), rotationSpeed: 1 }
      : null;
  };

  const rotateMyHead = (time: number, seconds: number): void => {
    const { rotation } = myHeadRef.current!;
    const turn = look.current;
    let lookPosition: Point = lookPositionStart();
    let rotationSpeed: number = 0.05;
    let skySpeed: number | undefined;

    holdWhileUnseen(time);
    if (stepReaction(time)) {
      lookPosition = { x: 0, y: 0 };
      rotationSpeed = TAP_TURN_SPEED;
    } else if (pointer.moved) {
      stopWandering(time);
      greeting = idle;
    } else {
      const own = stepLeftAlone(time, seconds);
      if (own) ({ lookPosition, rotationSpeed, skySpeed } = own);
    }

    heading.target = lookPosition;
    heading.speed = skySpeed ?? rotationSpeed;

    // Looking around on its own, it turns a little further than the pointer
    // can turn it (wander.ts WANDER_TURN).
    const [left, right] = wandering.current ? WANDER_TURN : TURN;
    lookPosition = {
      x: lookPositionLimit(lookPosition.x * 0.001, left, right),
      y: lookPositionLimit(lookPosition.y * 0.001, ...TIP),
    };

    const share = shareOver(rotationSpeed, seconds);
    turn.x += share * (lookPosition.y - turn.x);
    turn.y += share * (lookPosition.x - turn.y);
    const { body, head } = splitLook(turn);
    rotation.set(body.x, body.y, 0);
    ambient.current = stepAmbient(
      ambient.current,
      turn,
      time,
      seconds,
      Math.random,
      wandering.current !== null,
    );
    headTurn.value.set(head.x, head.y, ambient.current.tilt);
  };

  // The face's expression of its own now and then (ambient.ts), unless the
  // face is someone else's (`held`): then none runs underneath, so none is
  // under way to jump on when the face is its own again, and the last eases
  // out.
  const stepFace = (held: boolean, time: number, seconds: number): void => {
    if (!held) {
      face.current = ambientFace(ambient.current, time);
      return;
    }
    ambient.current = holdFace(ambient.current, time);
    face.current = Object.fromEntries(
      Object.entries(face.current).map(([name, strength]) => [
        name,
        easeToward(strength, 0, seconds, GREETING_EASE_RATE),
      ]),
    );
  };

  useFrame(({ clock, camera, size }, delta) => {
    fadeTime.value = clock.elapsedTime;
    // A tap or click that lands on the head (its skin, not the neck or the
    // shoulders: points the head weight carries nearly whole) sets off the
    // next reaction.
    if (tapAt.current && skinRef.current) {
      const { x, y } = tapAt.current;
      tapAt.current = null;
      raycaster.setFromCamera(
        new Vector2((x / size.width) * 2 - 1, 1 - (y / size.height) * 2),
        camera,
      );
      const [hit] = raycaster.intersectObject(skinRef.current, false);
      const weights = skinRef.current.geometry.getAttribute('headWeight');
      if (
        hit?.face &&
        onHead([hit.face.a, hit.face.b, hit.face.c], (i) => weights.getX(i))
      ) {
        taps.current = tapHead(taps.current, clock.elapsedTime);
        wandering.current = null;
        greeting = idle;
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
    // A tap's reaction, the greeting and the search are each eased in
    // quickly (headFace.ts).
    const isGreeting =
      tapsOn(taps.current) || greetingOn(greeting) || search.current !== null;
    const targets = faceTargets(
      { taps: taps.current, greeting, searching: search.current !== null },
      look.current,
      spot,
      {
        x: ((eyes.x + 1) / 2) * size.width,
        y: ((1 - eyes.y) / 2) * size.height,
      },
      size,
    );
    stepFace(isGreeting || headMood.worried, clock.elapsedTime, delta);
    strengths.current = expressions.map((name, k) =>
      easeToward(
        strengths.current[k] ?? 0,
        targets[name] ?? 0,
        delta,
        isGreeting ? GREETING_EASE_RATE : easeRate(name, look.current),
      ),
    );
    // The neck's shapes follow the head's turn this frame, not eased: they
    // are part of the turn (neckPose.ts).
    const neck: Record<string, number> = neckExpressions(headTurn.value);
    strengths.current = strengths.current.map(
      (s, k) => neck[expressions[k]!] ?? s,
    );
    // The passing look over it all, and a blink over that, on its own clock and with quick shifts of the
    // gaze; shown, not eased, so the lids snap shut and open as lids do.
    const gazeSpeed =
      Math.hypot(
        look.current.x - lastLook.current.x,
        look.current.y - lastLook.current.y,
      ) / Math.max(delta, 1e-3);
    lastLook.current = { ...look.current };
    blink.current = stepBlink(blink.current, clock.elapsedTime, gazeSpeed);
    const lids = blinkAmount(blink.current, clock.elapsedTime);
    const shown = strengths.current.map((s, k) => {
      const name = expressions[k]!;
      const made = Math.min(1, s + (face.current[name] ?? 0));
      return name === 'blink' ? Math.max(made, lids) : made;
    });
    for (const mesh of [skinRef.current, mouthRef.current])
      if (mesh) mesh.morphTargetInfluences = shown;
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
