import { useFrame } from '@react-three/fiber';
import { use, useEffect, useMemo, useRef } from 'react';
import {
  BackSide,
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
import {
  gazeTarget,
  heading,
  lookOnScreen,
  lookToRadians,
  Point,
  splitLook,
} from './headLook';
import { headMood } from './headMood';
import { HEAD_LIFT, lookOrigin } from './headPlace';
import { EYE_COLOR, GLOSS, MOUTH_COLOR, SKIN_COLOR } from './headSkin';
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
  GREETING_EASE_RATE,
  greetingOn,
  idle,
} from './idleGreeting';
import { intro, introFace, introHolds, introTip } from './intro';
import { Own, stepPage, usedAt, watched } from './leftAlone';
import { clamp } from './maths';
import { morphGeometry } from './morphGeometry';
import { fadeNeck, fadeTime } from './neckFade';
import { neckExpressions } from './neckPose';
import { faceInView, idleWait, PAGE_TARGETS } from './pageWatch';
import { SHOWN_EXPRESSIONS, SHOWN_SIDED } from './shownExpressions';
import { withSides } from './sideMorphs';
import { isStill } from './stillScene';
import { startWander, TIP, TURN, WANDER_TURN } from './wander';

type MyHeadGeometry = { [key: string]: BufferGeometry };

type MyHeadProps = {
  // Where the pointer has the head look, now, as a look target (headLook.ts).
  lookPositionStart: () => Point;
  // The pointer (useMousePosition): the head clears `moved` and `left` once
  // it has seen them (leftAlone.ts).
  pointer: MousePosition;
};

const skinShader: Material['onBeforeCompile'] = (shader) => {
  turnHead(shader);
  fadeNeck(shader);
};

// The point between the eyes, in head.bin units.
const EYES = new Vector3(-0.7, 2.7, 29.3);

// Where the head looks with reduced motion: straight at the camera.
const STILL_LOOK = { x: 0, y: 0 };

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
  // The inside of the head, lined in black while the intro's open mouth
  // shows it (intro.ts): the skin's inner faces, which are otherwise not
  // drawn, so the sky would show through the mouth.
  const liningRef = useRef<Mesh>(null);

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
  const strengths = useRef<Record<string, number>>({});
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
  // What it does left alone (leftAlone.ts): the greeting, looking for the
  // pointer it lost, looking around on its own, and the idle clock.
  const alone = useRef(usedAt(0, idleWait()));
  // When the last frame was drawn (none are while the tab is hidden).
  const lastFrame = useRef(0);
  // The little tilts and faint expressions it makes on its own (ambient.ts).
  const ambient = useRef<Ambient>(startAmbient(0));
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

  // While the face can't be seen clearly there is no greeting, and its clock
  // only counts the time it can, never time away from the page (watched).
  const holdWhileUnseen = (time: number): void => {
    alone.current = watched(alone.current, {
      time,
      lastFrame: lastFrame.current,
      seen: isTouch || faceInView(),
    });
    lastFrame.current = time;
  };

  const startWandering = (time: number): void => {
    alone.current = {
      ...alone.current,
      wandering: startWander(look.current, time),
    };
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
      if (isTouch && !alone.current.wandering) startWandering(time);
      return false;
    }
    taps.current = stepTaps(taps.current, time);
    if (!tapsOn(taps.current)) {
      if (isTouch) startWandering(time);
      else {
        alone.current = usedAt(time, idleWait());
        pointer.moved = false;
      }
    }
    return true;
  };

  // Whether every expression has eased out (the strengths are the last
  // frame's), for the greeting.
  const neutral = () => faceNeutral(withFace(strengths.current, face.current));

  // Where the head looks, left alone (leftAlone.ts), as a look target, how
  // fast it turns there, and how fast the sky follows.
  const ownHeading = (own: NonNullable<Own>) => {
    if (own.kind === 'greeting')
      return { lookPosition: { x: 0, y: 0 }, rotationSpeed: 0.05 };
    return {
      lookPosition: gazeTarget(own.gaze),
      rotationSpeed: 1,
      skySpeed: own.kind === 'wander' ? WANDER_SKY_SPEED : undefined,
    };
  };

  const rotateMyHead = (time: number, seconds: number): void => {
    const { rotation } = myHeadRef.current!;
    const turn = look.current;
    let lookPosition: Point = lookPositionStart();
    let rotationSpeed: number = 0.05;
    let skySpeed: number | undefined;

    holdWhileUnseen(time);
    if (introHolds(intro.state, time)) {
      // Loading, and coming out of the mouth (intro.ts): it faces the
      // camera, tipped up so its open mouth faces it flat, surprised then
      // smiling, and turns to the pointer after, the idle clock starting
      // then.
      lookPosition = { x: 0, y: 0 };
      alone.current = usedAt(time, idleWait());
      pointer.moved = false;
    } else if (stepReaction(time)) {
      lookPosition = { x: 0, y: 0 };
      rotationSpeed = TAP_TURN_SPEED;
    } else {
      const step = stepPage(
        alone.current,
        pointer,
        { time, seconds, look: turn, neutral },
        idleWait,
      );
      alone.current = step.state;
      if (step.own)
        ({ lookPosition, rotationSpeed, skySpeed } = ownHeading(step.own));
    }

    // With reduced motion it holds still, facing the camera (stillScene.ts).
    if (isStill()) {
      heading.target = STILL_LOOK;
      heading.speed = 1;
      Object.assign(turn, { x: 0, y: 0 });
      const { body, head } = splitLook(turn);
      rotation.set(body.x, body.y, 0);
      headTurn.value.set(head.x, head.y, 0);
      return;
    }

    heading.target = lookPosition;
    heading.speed = skySpeed ?? rotationSpeed;

    // Looking around on its own, it turns a little further than the pointer
    // can turn it (wander.ts WANDER_TURN).
    const [left, right] = alone.current.wandering ? WANDER_TURN : TURN;
    lookPosition = {
      x: clamp(lookToRadians(lookPosition.x), left, right),
      y: clamp(lookToRadians(lookPosition.y), ...TIP),
    };

    const share = shareOver(rotationSpeed, seconds);
    turn.x += share * (lookPosition.y - turn.x);
    turn.y += share * (lookPosition.x - turn.y);
    // The intro's tip is taken as it is: the camera starts in the mouth
    // where it puts it (HeadFraming.tsx).
    if (introHolds(intro.state, time))
      Object.assign(turn, { x: introTip(intro.state, time), y: 0 });
    const { body, head } = splitLook(turn);
    rotation.set(body.x, body.y, 0);
    ambient.current = stepAmbient(
      ambient.current,
      turn,
      time,
      seconds,
      Math.random,
      alone.current.wandering !== null,
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

  // Each expression's strength this frame: the neck's shapes as `neck` has
  // them; the intro's face shown as it is (surprised from the first frame,
  // the camera inside its open mouth, then smiling, on the intro's own
  // curves); otherwise eased toward `targets`, quickly while `held` (the
  // greeting, the search or a tap's reaction), as each eases from there.
  const stepStrengths = (
    targets: Record<string, number>,
    neck: Record<string, number>,
    seconds: number,
    held: boolean | 'intro',
  ): void => {
    for (const name of expressions) {
      const target = targets[name] ?? 0;
      strengths.current[name] =
        neck[name] ??
        (held === 'intro'
          ? target
          : easeToward(
              strengths.current[name] ?? 0,
              target,
              seconds,
              held ? GREETING_EASE_RATE : easeRate(name, look.current),
            ));
    }
  };

  useFrame(({ clock, camera, size }, delta) => {
    fadeTime.value = clock.elapsedTime;
    // A tap or click that lands on the head (its skin, not the neck or the
    // shoulders: points the head weight carries nearly whole) sets off the
    // next reaction.
    const isIntro = introHolds(intro.state, clock.elapsedTime);
    if (isIntro) tapAt.current = null;
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
        alone.current = { ...alone.current, wandering: null, greeting: idle };
      }
    }
    rotateMyHead(clock.elapsedTime, delta);
    // Where the head is looking, back in screen pixels, against where the
    // eyes are on screen.
    const spot = lookOnScreen(heading.target, {
      x: lookOrigin(size.width),
      y: size.height / 2,
    });
    const eyes = myHeadRef.current!.localToWorld(EYES.clone()).project(camera);
    // A tap's reaction, the greeting and the search are each eased in
    // quickly (headFace.ts).
    const { greeting, search } = alone.current;
    const isGreeting =
      isIntro ||
      tapsOn(taps.current) ||
      greetingOn(greeting) ||
      search !== null;
    const targets = isIntro
      ? introFace(intro.state, clock.elapsedTime)
      : faceTargets(
          { taps: taps.current, greeting, searching: search !== null },
          look.current,
          spot,
          {
            x: ((eyes.x + 1) / 2) * size.width,
            y: ((1 - eyes.y) / 2) * size.height,
          },
          size,
        );
    stepFace(isGreeting || headMood.worried, clock.elapsedTime, delta);
    // The neck's shapes follow the head's turn this frame, not eased: they
    // are part of the turn (neckPose.ts).
    const neck: Record<string, number> = neckExpressions(headTurn.value);
    stepStrengths(targets, neck, delta, isIntro ? 'intro' : isGreeting);
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
    // With reduced motion the face makes no expression: only the neck's
    // shapes for its (still) turn, and the blinks.
    const still = isStill();
    const shown = expressions.map((name) => {
      const made = still
        ? (neck[name] ?? 0)
        : Math.min(1, strengths.current[name]! + (face.current[name] ?? 0));
      return name === 'blink' ? Math.max(made, lids) : made;
    });
    for (const mesh of [skinRef.current, mouthRef.current, liningRef.current])
      if (mesh) mesh.morphTargetInfluences = shown;
    if (liningRef.current)
      liningRef.current.visible = isIntro && (targets.gasp ?? 0) > 0;
  });

  return (
    <group position={[0, HEAD_LIFT, 0]} ref={myHeadRef}>
      <mesh geometry={myHeadGeometry.skin} ref={skinRef}>
        <meshPhysicalMaterial
          color={SKIN_COLOR}
          {...GLOSS}
          transparent
          onBeforeCompile={skinShader}
        />
      </mesh>
      <mesh geometry={myHeadGeometry.skin} ref={liningRef}>
        <meshBasicMaterial
          color={MOUTH_COLOR}
          side={BackSide}
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
