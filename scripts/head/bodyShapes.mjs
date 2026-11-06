// The bust's own expressions: moves of the shoulders, chest and throat,
// made on the joined skin (scripts/build-head.mjs) rather than the face. The
// head stays still for each (the neck moves only in its own shapes, from
// MHR: scripts/head/mhr.mjs). Distances in head.bin units (about
// 1.7 mm): the chin's underside near y -65, the notch at the base of the
// throat near -124, the collarbones running out from it to the shoulders'
// tips about 150 from the midline, the bust cut at the nipples, -195.

import { bump, smoothstep } from './faceRig.mjs';
import { mhrNeck } from './mhr.mjs';
import { napeLine } from './napeLine.mjs';
import { SCM, scmCord } from './neckCords.mjs';
import { throatFill } from './throatFill.mjs';

// The neck's axis in depth (as scripts/head/rig.mjs measures it), and how
// much of a point belongs to the neck rather than the shoulders below it: the
// neck, within about NECK_RADIUS of its axis and above the shoulders, stays
// still, fading to the shoulders over the second distance.
const axisZ = (y) => -25 + (y + 72) * 0.43;
const NECK_RADIUS = [34, 50];
const neck = ([x, y, z]) =>
  (1 - smoothstep(Math.hypot(x, z - axisZ(y)), ...NECK_RADIUS)) *
  smoothstep(y, -128, -98);
// How much of a point lies in front of the neck's axis (the chest), against
// behind it (the back).
const front = ([, y, z]) => smoothstep(z - axisZ(Math.max(y, -130)), -25, 25);

// A shrug: the shoulder girdle raised, as the body does it. Each collarbone
// swings up about its joint with the breastbone (SHRUG.joint), carrying the
// shoulder blade, the shoulder and the arm with it as one piece, and a
// little forward; the swing reaches the full angle out from the joint and
// fades down the chest and the back (to the shoulder blades' lower edges).
// The neck stays, so the trapezius rises against it and bunches, and the
// hollow above each collarbone deepens.
const SHRUG = {
  joint: [9, -122, 2],
  lift: 0.22,
  forward: 0.12,
  rise: 6,
  socket: [125, -120, -10],
};

// p turned by `angle` about the axis through `c` along `k` (unit).
function turnAbout(p, c, k, angle) {
  const v = p.map((x, a) => x - c[a]);
  const [cos, sin] = [Math.cos(angle), Math.sin(angle)];
  const dot = v[0] * k[0] + v[1] * k[1] + v[2] * k[2];
  const cr = [
    k[1] * v[2] - k[2] * v[1],
    k[2] * v[0] - k[0] * v[2],
    k[0] * v[1] - k[1] * v[0],
  ];
  return v.map((x, a) => c[a] + x * cos + cr[a] * sin + k[a] * dot * (1 - cos));
}

function shrug({ vertices }) {
  return vertices.map((p) => {
    const [x, y] = p;
    const across = Math.abs(x);
    const side = Math.sign(x) || 1;
    // How much of the girdle's swing a point takes: none at the breastbone,
    // all of it out from the joint over the shoulder and along the arm, and
    // fading down the chest and back.
    // Above the armpit the shoulder swings whole; below it the side of the
    // ribcage stays, and only the arm (which hangs, below) rides up.
    const arm = smoothstep(across, 82, 112) * (1 - smoothstep(-y, 140, 170));
    const low = -205 * (1 - front(p)) - 175 * front(p);
    const down = arm + (1 - arm) * smoothstep(y, low, -120);
    const w = smoothstep(across, 8, 40) * down * (1 - neck(p));
    const joint = [side * SHRUG.joint[0], SHRUG.joint[1], SHRUG.joint[2]];
    // Up about the joint (the forward axis), then a little forward (about
    // the vertical).
    // The whole girdle also rides straight up (SHRUG.rise), as the shoulder
    // blades are drawn up the back: turned alone, the shoulder tips rose and
    // the slope from the neck flattened into a shelf.
    const swing = (q, share) =>
      turnAbout(
        turnAbout(q, joint, [0, 0, 1], side * SHRUG.lift * share),
        joint,
        [0, 1, 0],
        -side * SHRUG.forward * share,
      ).map((c, a) => c + (a === 1 ? SHRUG.rise * share : 0));
    // The arm hangs from its socket: it rides up with it rather than
    // turning with the collarbone (turned, it swung out from the body).
    const socket = [side * SHRUG.socket[0], SHRUG.socket[1], SHRUG.socket[2]];
    const carried = swing(socket, 1).map((c, a) => c - socket[a] + p[a]);
    const turned = swing(p, w);
    // Only the arm below the top of the shoulder hangs, the armpit's skin
    // front and back riding up with it (the arm hangs against the side, and
    // lifted alone it turned the crease between them over); the top of the
    // shoulder turns with the collarbone, tilting up at its outer end.
    const hang =
      smoothstep(across, 75, 92) * smoothstep(-y, 125, 150) * (1 - neck(p));
    const swung = turned.map((c, a) => c + (carried[a] - c) * hang);
    return swung.map((c, a) => c - p[a]);
  });
}

// The shrug's muscle forms, added after its swing is evened out (evened with
// it, they were smoothed away): the trapezius, contracting, bunches into a
// rounded ridge between the neck and the shoulder, and the hollow above each
// collarbone deepens as the bone rises.
function shrugForm({ vertices }, normal) {
  return vertices.map((p, i) => {
    const [x, y] = p;
    const across = Math.abs(x);
    const trapezius =
      bump(across - 40, 14) *
      bump(y - (-80 - 0.45 * (across - 30)), 10) *
      (1 - neck(p)) *
      9;
    // The hollow above the collarbone, pressed in as the bone rises.
    const hollow =
      bump(Math.hypot(across - 40, y + 106), 9) * front(p) * (1 - neck(p)) * 9;
    return normal[i].map((n) => (trapezius - hollow) * n);
  });
}

// The ribcage's swing for a breath in: about the spine at the back of the
// chest, by `lift` radians.
const BREATH = { spine: [0, -150, -85], lift: 0.19 };

// A breath in: the ribcage lifts and widens as the ribs do it, swinging up
// about the spine so the breastbone rises and comes forward, the lower ribs
// swinging out at the sides; the shoulders ride up a little and the neck
// stays.
function breathe({ vertices }) {
  return vertices.map((p) => {
    const [x, y] = p;
    const across = Math.abs(x);
    const still = 1 - neck(p);
    // The ribs swing up about the spine (BREATH.spine), lifting the
    // breastbone up and forward, more the further forward a point is; the
    // shoulders ride up a little on them.
    // The lower edge of the bust (the belly) stays where it is.
    const ribs =
      smoothstep(-y, 112, 138) *
      (1 - smoothstep(-y, 205, 245)) *
      still *
      (1 - 0.5 * smoothstep(across, 110, 140));
    const swung = turnAbout(p, BREATH.spine, [1, 0, 0], -BREATH.lift * ribs);
    const shoulders =
      2 * smoothstep(across, 40, 110) * smoothstep(y, -200, -110) * still;
    // The lower ribs swing out at the sides, like a bucket's handle: in a
    // deep breath the chest widens by about a centimetre each side.
    const sides =
      5 *
      smoothstep(across, 35, 85) *
      (1 - 0.6 * smoothstep(across, 110, 140)) *
      bump((y + 175) / 45, 1) *
      still;
    return [
      swung[0] - x + Math.sign(x) * sides,
      swung[1] - y + shoulders,
      swung[2] - p[2],
    ];
  });
}

// A swallow, at its height: the Adam's apple (scripts/head/sculpt.mjs)
// pulled up and forward, the front of the throat round it with it, a slight
// hollow left below where it was, and the floor of the mouth under the chin
// lifting and firming.
function swallow({ vertices }, normal) {
  return vertices.map(([x, y, z], i) => {
    const throat = smoothstep(z - axisZ(y), 12, 26);
    // The Adam's apple rides up about 2 cm as a compact bump, the skin of
    // the throat round it going with it, less further off, so it stays a
    // bump rather than piling up under the chin.
    const apple = Math.exp(-((x / 9) ** 2) - ((y + 89) / 9) ** 2) * throat;
    const skin = Math.exp(-((x / 14) ** 2) - ((y + 92) / 18) ** 2) * throat;
    const below = bump(Math.hypot(x, y + 104), 6) * throat;
    // The floor of the mouth, under the jaw, draws up and firms.
    const floor =
      bump(Math.hypot(x * 0.7, y + 74), 7) * smoothstep(z - axisZ(y), 5, 20);
    return [0, 1, 2].map(
      (a) =>
        (a === 1 ? 12 * apple + 5 * skin * (1 - smoothstep(y, -100, -66)) : 0) +
        (a === 2 ? 4.5 * apple : 0) -
        1.5 * below * normal[i][a] +
        (a === 1 ? 1.5 * floor : 0),
    );
  });
}

// Where a point sits round the neck's axis (`around`, 0 at the front,
// positive toward its own left), and the direction straight out from it.
const around = ([x, y, z]) => Math.atan2(x, z - axisZ(y));
const radial = ([x, y, z]) => {
  const r = Math.hypot(x, z - axisZ(y)) || 1;
  return [x / r, 0, (z - axisZ(y)) / r];
};
export const BODY_SHAPES = {
  shrug,
  breathe,
  swallow,
  // The neck's own shapes, made to go with a turn or nod of the head (the
  // page turns the head on the neck after the morphs: components/
  // Background/headTurn.ts, driven by neckPose.ts): MHR's scanned pose
  // correctives (scripts/head/mhr.mjs), filled in by bodyMoves. Looking down
  // takes none of MHR's: it stood the muscles at the sides of the neck out
  // in a ridge down from under the ear and bunched the throat into lumps,
  // where a real neck looking down, in a side photo, stays one smooth plane
  // from under the jaw to the shoulders. Its shape is the chin tuck alone
  // (bodyMoves).
  neckTurnLeft: null,
  neckTurnRight: null,
  // How the turned neck goes on changing past FULL_TURN to FAR_TURN
  // (neckPose.ts): the far turn's shape less the full turn's.
  neckTurnLeftFar: null,
  neckTurnRightFar: null,
  neckUp: null,
  neckDown: (skin) => skin.vertices.map(() => [0, 0, 0]),
};
// What each holds still: the head, down to a little below its join with the
// neck (scripts/build-head.mjs, JOIN: -38 at the back of the skull, z -56,
// sloping to -76 under the chin, z 15). A swallow lifts the floor of the
// mouth under the chin too.
const joinY = (z) => -38 + ((z + 56) * (-76 + 38)) / (15 + 56);
const headHeld = ([, y, z]) => y > joinY(z) - 6;
// The neck's shapes reach up under the chin; only the head above its jaw
// (and the face) stays still.
// Behind, the neck runs up to the skull's base (the join), so there only
// the head above it is held (held down to -60, the crease that tipping the
// head back makes at the nape was held flat).
const faceHeld = ([, y, z]) =>
  z < -20 ? y > joinY(z) - 4 : y > -60 || (y > -66 && z > 20);
const HELD = {
  shrug: headHeld,
  breathe: headHeld,
  neckTurnLeft: faceHeld,
  neckTurnRight: faceHeld,
  neckTurnLeftFar: faceHeld,
  neckTurnRightFar: faceHeld,
  neckUp: faceHeld,
  neckDown: faceHeld,
  swallow: ([, y]) => y > -64,
};

// The moves are then evened out over the surface, PASSES times, so they
// change gradually everywhere: the bust carries faint folds from MakeHuman's
// mesh (one runs down the upper back beside the neck), and a move that
// changes quickly across one sharpens it into a ridge. The head and the top
// of the neck (where `held(p)`) stay still.
const PASSES = 300;
// The neck's shapes and the swallow are narrow on purpose (a cord, a fold,
// the Adam's apple), so they are only lightly evened, enough to take the
// corners off: evened fully, the swallow all but disappeared.
const NECK_PASSES = 30;

// Each point's neighbours for evening: those it shares an edge with, or,
// along the bust's cut edges, its neighbours on the edge only (with
// neighbours on one side, it would be pulled in and fold).
function evenNeighbours({ vertices, faces }) {
  const neighbours = vertices.map(() => new Set());
  for (const f of faces)
    f.forEach((a, k) => {
      const b = f[(k + 1) % f.length];
      neighbours[a].add(b);
      neighbours[b].add(a);
    });
  const uses = new Map();
  const along = {};
  for (const f of faces)
    f.forEach((a, k) => {
      const b = f[(k + 1) % f.length];
      const key = a < b ? `${a},${b}` : `${b},${a}`;
      uses.set(key, (uses.get(key) ?? 0) + 1);
    });
  for (const [key, n] of uses) {
    if (n !== 1) continue;
    const [a, b] = key.split(',').map(Number);
    (along[a] ??= new Set()).add(b);
    (along[b] ??= new Set()).add(a);
  }
  for (const [i, ends] of Object.entries(along)) neighbours[i] = ends;
  return neighbours;
}

function even({ vertices, faces }, moves, held, passes = PASSES) {
  const neighbours = evenNeighbours({ vertices, faces });
  const free = vertices.flatMap((v, i) => (!held(v) ? [i] : []));
  let d = moves.map((m, i) => (held(vertices[i]) ? [0, 0, 0] : [...m]));
  for (let pass = 0; pass < passes; pass++) {
    const next = d.map((m) => [...m]);
    for (const i of free) {
      const sum = [0, 0, 0];
      for (const j of neighbours[i])
        for (let a = 0; a < 3; a++) sum[a] += d[j][a];
      for (let a = 0; a < 3; a++)
        next[i][a] = 0.5 * d[i][a] + (0.5 * sum[a]) / neighbours[i].size;
    }
    d = next;
  }
  return d;
}

// Looking down, the soft skin under the jaw bunches and rolls down and out
// from the neck, as a real chin tuck does. MHR's shapes fade out below the
// seam, so without this the chin's underside swung back into the throat with
// the skull and folded into a sharp notch, the top of the throat standing up
// into a point beside it; and with the roll under the chin alone, the jaw's
// edge still folded into the side of the neck. CHIN_TUCK: how far (units),
// along the seam where the jaw meets the neck (`joinY`) but never higher than
// `top`, fading over `width` above and below that, `down` and out from the
// neck's axis (`out`), all along the jaw and fading out behind its angle
// (`front`, depth). `top` keeps it off the jaw's sides, which stay still.
const CHIN_TUCK = {
  move: 4.5,
  top: -72,
  down: 0.6,
  out: 0.8,
  width: 9,
  front: [-35, -15],
};
const chinTuck = ([x, y, z]) => {
  const at =
    CHIN_TUCK.move *
    bump(y - Math.min(joinY(z), CHIN_TUCK.top), CHIN_TUCK.width) *
    smoothstep(z, ...CHIN_TUCK.front);
  const [ox, , oz] = radial([x, y, z]);
  return [CHIN_TUCK.out * ox, -CHIN_TUCK.down, CHIN_TUCK.out * oz].map(
    (c) => c * at,
  );
};

// Each body expression's move of every point of the joined skin, given its
// normals, share of the head's turn and head weight (rig.mjs turnWeights,
// headWeights), added to `all` (the expressions' moves), with the grimace's
// tight neck (platysma) added to its lipStretch.
export function bodyMoves(skin, normal, turns, weights, all) {
  // MHR's neck fades out well under the seam, over the top half of the
  // neck: MHR's jaw is not ours, and carried close to it (fading out over 10
  // units below the seam) its offsets sharpened the jaw's corner and drew a
  // line down from under the ear as the head turned.
  const scanned = mhrNeck(
    skin,
    ([, y, z]) => 1 - smoothstep(y - joinY(z), -55, -15),
  );
  delete scanned.neckDown;
  const moves = Object.fromEntries(
    Object.entries(BODY_SHAPES).map(([name, build]) => [
      name,
      even(
        skin,
        scanned[name] ?? build(skin, normal),
        HELD[name],
        name.startsWith('neck') || name === 'swallow' ? NECK_PASSES : PASSES,
      ),
    ]),
  );
  // The chin tuck is smooth as it is, so it goes on after the evening: held
  // to the face's still edge with the rest, its top showed as a line across
  // the throat.
  // So does the back of the neck's line (napeLine.mjs), lightly evened on
  // its own: as it is, it rippled the trapezius's outline below it.
  const nape = even(skin, napeLine(skin, weights), () => false, 8);
  moves.neckDown = moves.neckDown.map((m, i) =>
    m.map((c, a) => c + chinTuck(skin.vertices[i])[a] + nape[i][a]),
  );
  // The cords go on after the evening; turning to the head's own left (+x)
  // tightens the muscle on its right and draws out the one on its left. The
  // tight cord is smooth as it is; the drawn-out one is lightly evened, as
  // it crosses the folds above the collarbone (as it was, it rippled there).
  for (const [name, toward] of [
    ['neckTurnLeft', 1],
    ['neckTurnRight', -1],
  ]) {
    const cords = (turn) => {
      const cord = (side, rise) =>
        skin.vertices.map((p, i) =>
          scmCord(p, side, turns[i], toward * turn, rise),
        );
      const tight = cord(-toward, SCM.rise);
      const taut = even(
        skin,
        cord(toward, (SCM.taut * turn) / SCM.far),
        HELD[name],
        NECK_PASSES,
      );
      return tight.map((m, i) => m.map((c, a) => c + taut[i][a]));
    };
    const near = cords(SCM.turn);
    const far = cords(SCM.far);
    moves[`${name}Far`] = moves[`${name}Far`].map((m, i) =>
      m.map((c, a) => c + far[i][a] - near[i][a]),
    );
    moves[name] = moves[name].map((m, i) => m.map((c, a) => c + near[i][a]));
    // The throat above the Adam's apple, filled so the turn leaves no hollow
    // there (throatFill.mjs): at the full turn, then the far one's more.
    const evened = (m) => even(skin, m, HELD[name], NECK_PASSES);
    const fill = (shape, turn) =>
      throatFill(skin, turns, shape, turn, toward, evened);
    const add = (a, b) => a.map((m, i) => m.map((c, k) => c + b[i][k]));
    moves[name] = add(moves[name], fill(moves[name], SCM.turn));
    const both = add(moves[name], moves[`${name}Far`]);
    moves[`${name}Far`] = add(moves[`${name}Far`], fill(both, SCM.far));
  }
  const form = even(skin, shrugForm(skin, normal), HELD.shrug, NECK_PASSES);
  moves.shrug = moves.shrug.map((m, i) => m.map((c, a) => c + form[i][a]));
  const bands = platysma(skin);
  Object.assign(all, moves, {
    lipStretch: all.lipStretch.map((m, i) => m.map((c, a) => c + bands[i][a])),
  });
}

// The neck muscle under the skin of its front (platysma), drawn tight by a
// grimace (lipStretch: the mouth's corners pulled out and down): two bands
// standing out either side of the throat, from under the jaw down over the
// collarbones, spreading apart as they go down. Added to that expression on
// the joined skin (scripts/build-head.mjs), since the face's own shapes stop
// at the head's join with the neck.
function platysma(skin) {
  const bands = skin.vertices.map((p) => {
    const [, y, z] = p;
    const spread = 0.32 + 0.3 * smoothstep(y, -70, -125);
    const band = [-1, 1].reduce(
      (sum, side) => sum + bump(around(p) - side * spread, 0.13),
      0,
    );
    const on =
      band *
      smoothstep(y, -132, -118) *
      (1 - smoothstep(y, -76, -64)) *
      smoothstep(z - axisZ(y), 0, 10);
    return radial(p).map((c) => c * 4.5 * on);
  });
  // The face above and the shoulders below stay still: it is the face's
  // expression, and only the neck goes with it.
  return even(
    skin,
    bands,
    (p) => faceHeld(p) || p[1] < -136 || Math.abs(p[0]) > 60,
    NECK_PASSES,
  );
}
