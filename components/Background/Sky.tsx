import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import { Euler } from 'three';

import { heading } from './MyHead';

// The sky turns with the head: as far as 90° either way, so moving the
// pointer from one edge of the screen to the other turns it 180° (left to
// right turns it around, top to bottom tips it from overhead to underfoot).
// It follows the head's own look target, mouse or idle wandering, and eases
// there at the head's speed. The head's reflections turn with it.
const REACH = Math.PI / 2;

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
};

// How far the sky turned in the last frame, in radians.
export const skyRate = () => motion.rate;
// How much of each frame's aim change goes into its smoothed drift.
const DRIFT_SMOOTHING = 0.2;

const clampTurn = (value: number) => Math.min(Math.max(value, -REACH), REACH);

// Where a sky turning as `now` says will have turned `frames` from now, if
// its aim keeps moving as it is: the aim drifting on (as far as REACH), the
// sky easing after it at its speed.
export function forecastTurn(now: typeof motion, frames: number) {
  const { aim, drift, speed } = now;
  const turn = { ...now.turn };
  const ahead = { ...aim };
  for (let frame = 0; frame < frames; frame++) {
    ahead.x = clampTurn(ahead.x + drift.x);
    ahead.y = clampTurn(ahead.y + drift.y);
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

export default function Sky() {
  const turn = useRef(motion.turn);
  // The pointer reads (0, 0) until it first moves, which would turn the sky
  // to its corner on load; it stays still until the target first changes.
  const first = useRef<typeof heading.target | null>(null);

  useFrame(({ scene, size }) => {
    first.current ??= heading.target;
    if (heading.target === first.current) return;
    const aim = skyTurn(heading.target, size);
    for (const axis of ['x', 'y'] as const)
      motion.drift[axis] +=
        DRIFT_SMOOTHING * (aim[axis] - motion.aim[axis] - motion.drift[axis]);
    Object.assign(motion, { aim, speed: heading.speed });
    const step = {
      x: heading.speed * (aim.x - turn.current.x),
      y: heading.speed * (aim.y - turn.current.y),
    };
    turn.current.x += step.x;
    turn.current.y += step.y;
    motion.rate = Math.hypot(step.x, step.y);
    for (const rotation of [
      scene.backgroundRotation,
      scene.environmentRotation,
    ])
      setSkyRotation(rotation, turn.current);
  });

  return null;
}
