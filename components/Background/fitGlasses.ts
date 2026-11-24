import { BufferGeometry, Vector3 } from 'three';

import type { Glasses } from './glassesGeometry';
import { onSkull } from './skull';

// The Banner Eyewear sunglasses on the head, as the real pair is on Zack's,
// sized as glasses are, by the distance between the eyes: the bridge on the
// nose, the arms over the tops of the ears and the logo tips behind them. The
// front and the lenses are the model's, unbent. The model's arms curl inward,
// as a pair's do off the head; worn, they spring out round it and straighten,
// so each arm is flexed outward evenly along its length, and no more.

// How many of the glasses' millimetres one of the head's units is: that makes
// its eyes 65 mm apart, an ordinary man's, so they sit in the middle of the
// lenses. (Sized by the head's width instead the front was wider than the
// face, the more so seen as close up as the page's camera is.)
export const UNIT_MM = 1.94;
// How much longer than the model's the arms are: at that size the head is
// long, its ears as far behind its eyes as a large man's.
export const ARM = 1.12;

// Where the pair rests, found by measuring it against the head at every
// place round there (fitGlasses.test.ts holds it to touching the head
// nowhere): its own origin against the middle of the eyes, in the head's
// units; tipped back by TILT, so the arms come up over the ears; and how far
// each arm is turned out at its hinge (OPEN) and, by its tip, flexed (FLEX),
// in radians.
const UP = 2;
const FORWARD = -15;
const TILT = 0.12;
const OPEN = 0.02;
const FLEX = 0.36;
// How far each arm is angled down at its hinge, in radians, so it comes down
// from the brow to rest on the top of the ear, as worn arms do; and, past the
// ear's top (BACK of the arm's length from the hinge), how much more it curls
// down behind the ear (CURL, of the arm's length at its tip, by the square of
// the way past BACK), so its back half sits on the ear rather than arching
// over it.
const DROOP = 0.058;
const BACK = 0.75;
const CURL = 0.5;

export type Fitted = Glasses & {
  // How far above its place the pair drops from.
  drop: number;
};

export function fitGlasses(
  glasses: Glasses,
  left: Vector3,
  right: Vector3,
): Fitted {
  const eyes = left.clone().add(right).multiplyScalar(0.5);
  const place = (part: BufferGeometry) => {
    const g = part.clone();
    g.scale(1 / UNIT_MM, 1 / UNIT_MM, 1 / UNIT_MM);
    g.rotateX(TILT);
    g.translate(eyes.x, eyes.y + UP, eyes.z + FORWARD);
    g.computeBoundingBox();
    return g;
  };
  // An arm and its word, flexed together from the arm's hinge (its front
  // end's outer edge, `side` 1 at +x) to its tip: `along` back from the
  // hinge, it is turned out by OPEN and FLEX's share of the way to the tip.
  const arm = (side: 1 | -1, track: BufferGeometry, word: BufferGeometry) => {
    const parts = [place(track), place(word)];
    const { min, max } = parts[0]!.boundingBox!;
    const hinge = { x: side > 0 ? max.x : min.x, z: max.z };
    const length = (max.z - min.z) * ARM;
    const p = new Vector3();
    return parts.map((g) => {
      const position = g.getAttribute('position');
      for (let k = 0; k < position.count; k++) {
        p.fromBufferAttribute(position, k);
        const along = (hinge.z - p.z) * ARM;
        const out = p.x - hinge.x;
        const flex = (FLEX * along) / length;
        const turn = OPEN + flex;
        const past = Math.max(0, along / length - BACK);
        const down = DROOP * along + CURL * length * past * past;
        position.setXYZ(
          k,
          hinge.x + side * (OPEN + flex / 2) * along + out * Math.cos(turn),
          p.y - down,
          hinge.z -
            along * (1 - (turn * turn) / 6) +
            side * out * Math.sin(turn),
        );
      }
      g.computeVertexNormals();
      return onSkull(g);
    }) as [BufferGeometry, BufferGeometry];
  };
  const [leftArm, leftText] = arm(1, glasses.left, glasses.leftText);
  const [rightArm, rightText] = arm(-1, glasses.right, glasses.rightText);
  return {
    frame: onSkull(place(glasses.frame)),
    lenses: onSkull(place(glasses.lenses)),
    left: leftArm,
    right: rightArm,
    leftText,
    rightText,
    drop: left.distanceTo(right) * 9,
  };
}
