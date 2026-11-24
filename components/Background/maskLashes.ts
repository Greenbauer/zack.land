import {
  BufferAttribute,
  BufferGeometry,
  CatmullRomCurve3,
  Vector2,
  Vector3,
} from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

// The sleep mask's closed eyes (sleepMask.ts): on each a thick lash line
// along the lid's curve, thinning to a point at both corners, and long
// lashes that fan out from it, each sweeping down and away and flicking up at
// its tip, thick at its root and drawn out to a fine point, as a lash is. In
// eye spreads, as the mask is.

// Where the lids are on the pad: their middles across and up, how far across
// either side each runs, and how far its middle droops below its ends.
const LID = { across: 0.44, up: 0.1, half: 0.27, droop: 0.13 };
// A lid's line at `t` (-1 to 1 across it) for the eye on `side`.
const lidAt = (side: 1 | -1, t: number) =>
  new Vector2(
    side * LID.across + t * LID.half,
    LID.up - LID.droop * (1 - t * t),
  );

const LASHES = 9;
// How wide the lashes fan, from the lid's middle to each corner, and how far
// the whole fan leans toward the outer corner (radians).
const FAN = 0.8;
const LEAN = 0.1;
// A lash's length at the inner corner and at the outer, and how far up its
// tip flicks (a share of its length).
const LENGTH = [0.13, 0.22] as const;
const FLICK = 0.42;
// How thick a lash is at its root and the lid line at its middle (radius).
const ROOT = 0.02;
const LINE = 0.024;

// A tube along `curve` whose radius at `s` (0 to 1 along it) is `radius(s)`.
function taperedTube(
  curve: CatmullRomCurve3,
  radius: (_s: number) => number,
): BufferGeometry {
  const STEPS = 22;
  const SIDES = 8;
  const { normals, binormals } = curve.computeFrenetFrames(STEPS);
  const positions: number[] = [];
  for (let k = 0; k <= STEPS; k++) {
    const at = curve.getPoint(k / STEPS);
    const r = radius(k / STEPS);
    for (let j = 0; j < SIDES; j++) {
      const a = (j / SIDES) * Math.PI * 2;
      positions.push(
        ...at
          .clone()
          .addScaledVector(normals[k]!, r * Math.cos(a))
          .addScaledVector(binormals[k]!, r * Math.sin(a))
          .toArray(),
      );
    }
  }
  const index: number[] = [];
  for (let k = 0; k < STEPS; k++)
    for (let j = 0; j < SIDES; j++) {
      const a = k * SIDES + j;
      const b = k * SIDES + ((j + 1) % SIDES);
      index.push(a, b, b + SIDES, a, b + SIDES, a + SIDES);
    }
  const tube = new BufferGeometry();
  tube.setAttribute(
    'position',
    new BufferAttribute(new Float32Array(positions), 3),
  );
  tube.setIndex(index);
  tube.computeVertexNormals();
  return tube;
}

// The lash lines and lashes, laid on the mask by `place` (a point across,
// up and out from the mask's back) whose pad stands `puff` off it, for eyes
// `spread` apart.
export function maskLashes(
  place: (_across: number, _up: number, _out: number) => Vector3,
  puff: number,
  spread: number,
): BufferGeometry {
  const tubes: BufferGeometry[] = [];
  for (const side of [-1, 1] as const) {
    const line = Array.from({ length: 17 }, (_, k) => {
      const p = lidAt(side, -0.97 + (1.94 * k) / 16);
      return place(p.x, p.y, puff);
    });
    tubes.push(
      taperedTube(
        new CatmullRomCurve3(line),
        (s) => spread * LINE * Math.sin(Math.PI * s) ** 0.55,
      ),
    );
    for (let k = 0; k < LASHES; k++) {
      const t = -0.94 + (1.88 * k) / (LASHES - 1);
      // 0 at the inner corner, 1 at the outer.
      const outer = (side * t + 1) / 2;
      const length = LENGTH[0] + (LENGTH[1] - LENGTH[0]) * outer;
      const angle = t * FAN + side * LEAN;
      const root = lidAt(side, t);
      // Down and away along its fan, then its tip flicked up and on out.
      const along = (share: number, up: number, out: number) =>
        place(
          root.x + Math.sin(angle) * length * share,
          root.y - Math.cos(angle) * length * share + up * length,
          puff + out * length,
        );
      const curve = new CatmullRomCurve3([
        along(0, 0, 0),
        along(0.42, 0, 0.1),
        along(0.8, 0.06, 0.24),
        along(1.08, FLICK * 0.55, 0.28),
        along(1.2, FLICK, 0.32),
      ]);
      tubes.push(taperedTube(curve, (s) => spread * ROOT * (1 - s) ** 0.7));
    }
  }
  return mergeGeometries(tubes);
}
