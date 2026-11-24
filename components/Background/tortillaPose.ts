import { Euler, Quaternion, Vector3 } from 'three';

import type { Frame, Surface } from './tortillaDrape';
import { AZIMUTHS, FLIES, Throw, TORTILLA_RADIUS } from './tortillaFlight';

// What a tortilla thrown at the head does (tortillaFlight.ts), from its hand
// to the floor: it spins in from off the window's side, tips up and slaps
// into the head, its middle first and its edges whipping on after, flapping;
// then either sticks, slides slowly down, peels off from the top and drops,
// or glances off and tumbles away, still limp.

// How far off the skin it lies.
const GAP = 1.5;
// How long before it hits it tips to face the head (seconds).
const TIPS = 0.28;
// How far off to the side it comes from: off any window.
export const FROM = 620;
// How long its middle takes to lie down on the head, and how much later its
// edge starts to.
const SLAP = 0.09;
const WHIP = 0.1;
// How many times it gives as it slides down.
const SLIPS = 2;
// How long it takes to peel off before it drops, and how it falls.
const PEEL = 0.45;
const GRAVITY = 900;
// How long one that glances off touches the head.
const TOUCH = 0.16;

const ease = (t: number) => {
  const c = Math.min(1, Math.max(0, t));
  return c * c * (3 - 2 * c);
};

// How far it is drawn to the head `since` it was thrown, 0 flying to 1: it
// turns with the head as far as that, from just before it hits.
export const holdOf = (since: number) => ease((since - FLIES + 0.2) / 0.2);

const SPINNING = new Quaternion();
const FACING = new Quaternion();
const POINT = new Vector3();
const X = new Vector3(1, 0, 0);

// Where one is thrown, and the head there (poseThrow).
type Hit = { thrown: Throw; since: number; frame: Frame; surface: Surface };

// In the air.
function poseFlying(
  { thrown, since, frame }: Hit,
  flat: number,
  rest: ArrayLike<number>,
  out: Float32Array,
): void {
  const azimuth = AZIMUTHS[thrown.azimuth]!;
  const side = Math.sign(azimuth);
  // From off the side, lobbed, to where it hits.
  const v = since / FLIES;
  const hit = frame.world(0, thrown.up, flat);
  const x = side * FROM + (hit[0] - side * FROM) * v;
  const y =
    thrown.up - thrown.lob * 0.5 * (1 - v) + thrown.lob * 4 * v * (1 - v);
  const z = hit[2] + 30 * (1 - v);
  SPINNING.setFromEuler(
    new Euler(-Math.PI / 2 + 0.6, Math.sin(since * 9) * 0.2, 0),
  ).multiply(
    new Quaternion().setFromAxisAngle(
      new Vector3(0, 0, 1),
      since * thrown.spin,
    ),
  );
  FACING.setFromEuler(new Euler(0, azimuth, 0));
  SPINNING.slerp(FACING, ease((since - FLIES + TIPS) / TIPS));
  for (let k = 0; k < rest.length; k += 3) {
    POINT.fromArray(rest as number[], k).applyQuaternion(SPINNING);
    out[k] = x + POINT.x;
    out[k + 1] = y + POINT.y;
    out[k + 2] = z + POINT.z;
  }
}

// On the head, then off it and falling.
function poseLanded(
  { thrown, since, frame, surface }: Hit,
  flat: number,
  rest: ArrayLike<number>,
  out: Float32Array,
): void {
  const on = since - FLIES;
  const sticks = thrown.kind === 'sticks';
  const held = sticks ? thrown.cling : TOUCH;
  // Sliding down while it sticks, in slips: it holds a moment, then gives.
  const along = Math.min(1, on / (held + PEEL));
  const slips =
    along + Math.sin(along * Math.PI * 2 * SLIPS) / (Math.PI * 2 * SLIPS);
  const slid = sticks ? thrown.slide * slips : 0;
  const up = thrown.up - slid;
  // Peeling, from its top edge down (0 to 1), then off and falling.
  const peel = sticks ? Math.min(1, Math.max(0, (on - held) / PEEL)) : 0;
  const fall = Math.max(0, on - held - (sticks ? PEEL : 0));
  // One that glances off is clear of the head before it tumbles.
  const tumble = sticks ? fall * 2.4 : Math.max(0, fall - 0.12) * 7.5;
  const drift = fall * (sticks ? 45 : 330 * Math.exp(-fall * 1.6));
  const drop = 0.5 * GRAVITY * fall * fall - (sticks ? 0 : 130 * fall);
  const middle = surface(0, up) + GAP;
  for (let k = 0; k < rest.length; k += 3) {
    const [rx, ry] = [rest[k]!, rest[k + 1]!];
    const far = Math.hypot(rx, ry) / TORTILLA_RADIUS;
    // Lying down from the middle out, the edge flapping on as it lands.
    const lies = ease((on - far * WHIP) / SLAP);
    const flap =
      far * far * 9 * Math.exp(-on * 5) * Math.sin(Math.max(0, on) * 30);
    const held = surface(rx, up + ry) + GAP;
    // Its edge wobbles as it slides.
    const wobble =
      far * far * 1.6 * (1 + Math.sin(on * 13 + Math.atan2(ry, rx) * 2));
    let o = flat + (held - flat) * lies + (Math.max(flap, 0) + wobble) * lies;
    // Its top edge peels off first, bending over outward.
    const loose = Math.max(0, ry / TORTILLA_RADIUS - (1 - 2 * peel));
    o += loose * loose * 26 * ease(peel * 2);
    // Off the head it keeps some of its bend, flopping as it falls.
    if (fall > 0) {
      const flop = 0.55 + 0.25 * Math.sin(fall * 14 + rx * 0.03);
      o = middle + (o - middle) * (1 + (flop - 1) * ease(fall * 4));
    }
    POINT.set(rx, ry, o - middle);
    if (fall > 0) POINT.applyAxisAngle(X, tumble);
    const at = frame.world(
      POINT.x,
      up + POINT.y - drop,
      middle + POINT.z + drift,
    );
    out[k] = at[0];
    out[k + 1] = at[1];
    out[k + 2] = at[2];
  }
}

// Lays the tortilla's points (`rest`: a flat round, x across and y up its
// face, x, y, z in turn) where `thrown` has them `since` seconds after it was
// thrown, into `out`, as points of the head (`frame`, `surface`: where it
// hits).
export function poseThrow(
  thrown: Throw,
  since: number,
  rest: ArrayLike<number>,
  frame: Frame,
  surface: Surface,
  out: Float32Array,
): void {
  // Flat, it meets the head at whatever of it stands out furthest there.
  let flat = -Infinity;
  for (let k = 0; k < rest.length; k += 3)
    flat = Math.max(flat, surface(rest[k]!, thrown.up + rest[k + 1]!));
  const pose = since < FLIES ? poseFlying : poseLanded;
  pose({ thrown, since, frame, surface }, flat + GAP, rest, out);
}
