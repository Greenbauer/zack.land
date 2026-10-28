import { useFrame } from '@react-three/fiber';
import { useEffect, useRef } from 'react';
import { Euler } from 'three';

import { glide } from './headPlace';
import { heading } from './MyHead';
import { skyState } from './skyState';
import { currentView, LIGHT_SKIES, Station, stationFor } from './skyViews';

// The sky turns with the head, about the home each view of the site gives it
// (skyViews.ts): the pointer from one edge of the screen to the other turns
// it that view's reach either way (left and right turn it, top and bottom
// tip it), never so far that the text over it switches between light and
// dark. Moving to another view (a page, or the next post), the sky glides to
// that view's home over about HOME_SECONDS, showing a different part of the
// dawn. It follows the head's own look target, mouse or idle wandering, and
// eases there at the head's speed. The head's reflections turn with it.
// skyTurn's full range, which the view's reach scales down.
const REACH = Math.PI / 2;
const HOME_SECONDS = 2.5;
// How long the sky must stay within its view's safe range before text over it
// takes its station's side (skyState.ts), in seconds.
const REST_SECONDS = 1;
// How often the view on screen is checked, in milliseconds.
const VIEW_MS = 300;

const clamp = (value: number) => Math.min(Math.max(value, -1), 1);

// The sky's turn for a look target in MyHead's pointer units
// ((pointer - (width / 3, height / 2)) * 0.5): x tips it, y turns it,
// in radians. The pointer at the left or top edge gives -REACH, at the right
// or bottom edge REACH.
export function skyTurn(
  target: { x: number; y: number },
  size: { width: number; height: number },
) {
  const across = ((target.x / 0.5 + size.width / 3) / size.width) * 2 - 1;
  const down = ((target.y / 0.5 + size.height / 2) / size.height) * 2 - 1;
  return { x: clamp(down) * REACH, y: clamp(across) * REACH };
}

// Sets a scene rotation (the sky's or its reflections') to a turn. The order
// tips the sky after turning it, so left and right spin it about the vertical
// and only up and down move the horizon; the other order tilts the horizon
// sideways whenever the pointer is off to one side and up or down at once.
export function setSkyRotation(
  rotation: Euler,
  turn: { x: number; y: number },
) {
  rotation.set(turn.x, turn.y, 0, 'XYZ');
}

// The sky's turn now, where it is easing to, and how fast that aim is
// moving (per frame, smoothed): read by the title (TitleName.tsx) to see
// where the sky is going.
const motion = {
  turn: { x: 0, y: 0 },
  aim: { x: 0, y: 0 },
  drift: { x: 0, y: 0 },
  speed: 0,
  // How far the sky turned in the last frame, in radians.
  rate: 0,
  // How far the aim can go: the view's home, its reach either way.
  low: { x: -REACH, y: -REACH },
  high: { x: REACH, y: REACH },
};

// How far the sky turned in the last frame, in radians.
export const skyRate = () => motion.rate;
// How much of each frame's aim change goes into its smoothed drift.
const DRIFT_SMOOTHING = 0.2;

const clampTurn = (value: number, low = -REACH, high = REACH) =>
  Math.min(Math.max(value, low), high);

// Where a sky turning as `now` says will have turned `frames` from now, if
// its aim keeps moving as it is: the aim drifting on (as far as its view's
// reach, or REACH), the sky easing after it at its speed.
export function forecastTurn(
  now: Omit<typeof motion, 'low' | 'high'> &
    Partial<Pick<typeof motion, 'low' | 'high'>>,
  frames: number,
) {
  const { aim, drift, speed, low, high } = now;
  const turn = { ...now.turn };
  const ahead = { ...aim };
  for (let frame = 0; frame < frames; frame++) {
    ahead.x = clampTurn(ahead.x + drift.x, low?.x, high?.x);
    ahead.y = clampTurn(ahead.y + drift.y, low?.y, high?.y);
    turn.x += speed * (ahead.x - turn.x);
    turn.y += speed * (ahead.y - turn.y);
  }
  return turn;
}

// The sky's rotation `frames` from now.
export function skyAhead(frames: number, rotation: Euler) {
  setSkyRotation(rotation, forecastTurn(motion, frames));
  return rotation;
}

// Where the view's home has glided to, and how fast it is moving.
type Home = { x: number; y: number; speed: { x: number; y: number } };

export default function Sky() {
  const turn = useRef(motion.turn);
  // The view on screen's station, checked a few times a second, and the home
  // gliding toward it (starting there, so a page opens on its own sky).
  const station = useRef<Station | null>(null);
  const home = useRef<Home | null>(null);
  // The pointer reads (0, 0) until it first moves; until then it counts as
  // the middle of the screen, so the sky sits at its home.
  const first = useRef<typeof heading.target | null>(null);
  // When the sky came to rest at its view's home (clock seconds).
  const restSince = useRef<number | null>(null);

  useEffect(() => {
    const check = () => {
      station.current = stationFor(currentView());
    };
    check();
    const timer = setInterval(check, VIEW_MS);
    return () => clearInterval(timer);
  }, []);

  useFrame(({ clock, scene, size }, delta) => {
    const view = station.current;
    if (!view) return;
    if (!home.current) {
      home.current = { ...view.home, speed: { x: 0, y: 0 } };
      Object.assign(turn.current, view.home);
    }
    const seconds = Math.min(delta, 0.1);
    for (const axis of ['x', 'y'] as const) {
      const step = glide(
        { x: home.current[axis], speed: home.current.speed[axis] },
        view.home[axis],
        seconds,
        HOME_SECONDS,
      );
      home.current[axis] = step.x;
      home.current.speed[axis] = step.speed;
    }
    first.current ??= heading.target;
    const pointer =
      heading.target === first.current
        ? { x: 0, y: 0 }
        : skyTurn(heading.target, size);
    // The pointer's turn, scaled from REACH down to the view's reach, about
    // the home.
    const aim = {
      x: home.current.x + (pointer.x / REACH) * view.reach.x,
      y: home.current.y + (pointer.y / REACH) * view.reach.y,
    };
    Object.assign(motion, {
      low: {
        x: home.current.x - view.reach.x,
        y: home.current.y - view.reach.y,
      },
      high: {
        x: home.current.x + view.reach.x,
        y: home.current.y + view.reach.y,
      },
    });
    for (const axis of ['x', 'y'] as const)
      motion.drift[axis] +=
        DRIFT_SMOOTHING * (aim[axis] - motion.aim[axis] - motion.drift[axis]);
    // The sky eases after its aim at the head's speed.
    const speed = heading.speed;
    Object.assign(motion, { aim, speed });
    const step = {
      x: speed * (aim.x - turn.current.x),
      y: speed * (aim.y - turn.current.y),
    };
    turn.current.x += step.x;
    turn.current.y += step.y;
    motion.rate = Math.hypot(step.x, step.y);
    // At rest once the home has arrived (radians) and the sky itself has come
    // within the view's reach of it (the range its station was measured
    // over), and has stayed so for REST_SECONDS: only then do text and cards
    // take the side its station reads on (light or dark, skyViews.ts), so a
    // side they took while the sky was on its way is not kept.
    const arrived =
      Math.hypot(home.current.x - view.home.x, home.current.y - view.home.y) <
        0.02 &&
      Math.abs(turn.current.x - home.current.x) <= view.reach.x + 0.03 &&
      Math.abs(turn.current.y - home.current.y) <= view.reach.y + 0.03;
    restSince.current = arrived
      ? (restSince.current ?? clock.elapsedTime)
      : null;
    skyState.settled =
      restSince.current !== null &&
      clock.elapsedTime - restSince.current >= REST_SECONDS;
    skyState.light = LIGHT_SKIES.includes(view);
    for (const rotation of [
      scene.backgroundRotation,
      scene.environmentRotation,
    ])
      setSkyRotation(rotation, turn.current);
  });

  return null;
}
