import { BufferAttribute, BufferGeometry, Vector3 } from 'three';

// The smart bed's sleep mask (StoryProps.tsx), made to fit the head's own
// skin: a smooth band round the head, wide over the eyes as a padded pad and
// narrow at the sides and back as its strap, above the ears. It is laid out
// round an upright line through the middle of the head: at each angle round
// it and each height, as far out as the skin there, bridged over the eye
// sockets (it rests on the brow and the cheeks, as a real one does, not in
// them), smoothed, and lifted off it a little. The head closes its eyes
// under it (chapters.ts).

// The band's heights, in eye spreads (the distance between the eyes) from the
// eyes: the pad from below the eyes to above the brows, the strap from
// STRAP.low (above the ears) to the same top. The pad covers the front,
// PAD_ANGLE either side of it, its padding easing into the strap's.
const PAD = { low: -0.42, high: 0.6 };
const STRAP = { low: 0.34 };
const PAD_ANGLE = (75 * Math.PI) / 180;
// The pad's shape, by its lower edge: full depth over the eyes out to
// LOBE_ANGLE, narrowing from there into the strap by PAD_ANGLE, and cut up
// to NOTCH over the nose, NOSE_ANGLE either side of the middle.
const LOBE_ANGLE = (38 * Math.PI) / 180;
const NOSE_ANGLE = (9 * Math.PI) / 180;
const NOTCH = -0.24;
// How far behind the eyes the head's middle is, in eye spreads.
const MIDDLE_BACK = 1.4;
// The grid it is laid out on: steps round the head and down the band.
const AROUND = 144;
const DOWN = 18;
// How far it stands off the skin, in eye spreads: the pad padded, the strap
// a thin elastic.
const PAD_LIFT = 0.06;
const STRAP_LIFT = 0.025;
// How many steps either way a hollow is bridged across (the eye sockets).
const BRIDGE = 3;

type Grid = number[][];

const around = (col: number, by: number) => (col + by + AROUND) % AROUND;
// A step round's angle from straight ahead, -PI to PI.
const angleOf = (col: number) => {
  const a = (col / AROUND) * 2 * Math.PI;
  return a > Math.PI ? a - 2 * Math.PI : a;
};
const smoothstep = (t: number) => {
  const c = Math.min(1, Math.max(0, t));
  return c * c * (3 - 2 * c);
};
// How much of the pad's shape and padding a step round has: all of it out
// to LOBE_ANGLE, none from PAD_ANGLE on.
const padShare = (col: number) =>
  1 -
  smoothstep((Math.abs(angleOf(col)) - LOBE_ANGLE) / (PAD_ANGLE - LOBE_ANGLE));

// How far out the skin is from `middle` at each step round and down (0 where
// there is none), its rows from `low` to `high`.
function skinReach(
  positions: ArrayLike<number>,
  middle: { x: number; z: number },
  low: number,
  high: number,
): Grid {
  const reach = Array.from({ length: AROUND }, () =>
    new Array<number>(DOWN + 1).fill(0),
  );
  for (let k = 0; k < positions.length; k += 3) {
    const row = Math.round(((positions[k + 1]! - low) / (high - low)) * DOWN);
    if (row < 0 || row > DOWN) continue;
    const dx = positions[k]! - middle.x;
    const dz = positions[k + 2]! - middle.z;
    const col = around(
      Math.round((Math.atan2(dx, dz) / (2 * Math.PI)) * AROUND),
      0,
    );
    reach[col]![row] = Math.max(reach[col]![row]!, Math.hypot(dx, dz));
  }
  return reach;
}

// The furthest out within BRIDGE steps round and one down of a point, so the
// mask spans the hollows of the eye sockets.
function bridge(reach: Grid): Grid {
  const most = (col: number, row: number) => {
    const near: number[] = [];
    for (let by = -BRIDGE; by <= BRIDGE; by++)
      near.push(
        ...reach[around(col, by)]!.slice(Math.max(0, row - 1), row + 2),
      );
    return Math.max(...near);
  };
  return reach.map((column, col) => column.map((_, row) => most(col, row)));
}

// Each point averaged with its neighbours round, so the mask runs smooth.
const smoothed = (grid: Grid): Grid =>
  grid.map((column, col) =>
    column.map(
      (r, row) =>
        (grid[around(col, -1)]![row]! + 2 * r + grid[around(col, 1)]![row]!) /
        4,
    ),
  );

// The mask's lower edge at each step round, in eye spreads from the eyes:
// the notch over the nose, the lobes over the eyes, easing up into the
// strap at the sides.
function bottomAt(col: number): number {
  const a = Math.abs(angleOf(col));
  const lobe = STRAP.low + (PAD.low - STRAP.low) * padShare(col);
  const notch = smoothstep((NOSE_ANGLE - a) / (NOSE_ANGLE * 0.6) + 0.5);
  return lobe + (NOTCH - lobe) * notch;
}

// The mask for a skin of `positions` (x, y, z in turn), its eyes' middle at
// `eyes`, `spread` apart.
export function sleepMask(
  positions: ArrayLike<number>,
  eyes: Vector3,
  spread: number,
): BufferGeometry {
  const middle = { x: eyes.x, z: eyes.z - MIDDLE_BACK * spread };
  const low = eyes.y + PAD.low * spread;
  const high = eyes.y + PAD.high * spread;
  const reach = smoothed(bridge(skinReach(positions, middle, low, high)));
  const out: number[] = [];
  const index: number[] = [];
  const at = new Map<string, number>();
  // A point of the mask: as far out as the skin there and lifted off it,
  // and never below the mask's lower edge (the rows below are folded up
  // onto it, to nothing, so the edge runs smooth rather than in steps).
  const vertex = (col: number, row: number) => {
    const key = `${col} ${row}`;
    if (!at.has(key)) {
      const angle = angleOf(col);
      const lift = STRAP_LIFT + (PAD_LIFT - STRAP_LIFT) * padShare(col);
      const r = reach[col]![row]! + lift * spread;
      at.set(key, out.length / 3);
      out.push(
        middle.x + r * Math.sin(angle),
        Math.max(
          low + (row / DOWN) * (high - low),
          eyes.y + bottomAt(col) * spread,
        ),
        middle.z + r * Math.cos(angle),
      );
    }
    return at.get(key)!;
  };
  for (let col = 0; col < AROUND; col++)
    for (let row = 0; row < DOWN; row++) {
      const corners = [
        [col, row],
        [around(col, 1), row],
        [around(col, 1), row + 1],
        [col, row + 1],
      ] as const;
      if (corners.some(([c, r]) => !reach[c]![r])) continue;
      const [a, b, c, d] = corners.map(([c, r]) => vertex(c, r));
      // Facing out, away from the head: round the quad anticlockwise as
      // seen from outside.
      index.push(a!, b!, c!, a!, c!, d!);
    }
  const mask = new BufferGeometry();
  mask.setAttribute('position', new BufferAttribute(new Float32Array(out), 3));
  mask.setIndex(index);
  mask.computeVertexNormals();
  return mask;
}
