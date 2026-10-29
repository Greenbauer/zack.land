// Builds public/background/geometry/head.bin: the 3D head (myHead.obj),
// smoothed by one subdivision, joined seamlessly to an anatomical bust (neck,
// shoulders and chest) from MakeHuman's CC0 base mesh, as one welded surface.
// The file format is described in components/Background/headGeometry.ts.
//
//   node scripts/build-head.mjs
//
// MakeHuman's base mesh and targets are CC0 1.0 (LICENSE.md in the repository
// below, "C. The license for the bundled assets"). They are pinned to a commit
// and downloaded to the system temp directory on first run.

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { bridge } from './head/bridge.mjs';
import { bustMoves, EXPRESSIONS, expressions } from './head/expressions.mjs';
import {
  add,
  average,
  boundaryLoops,
  clip,
  compact,
  component,
  normals,
  scale,
  smooth,
  subdivide,
  triangulate,
  weld,
} from './head/mesh.mjs';
import { openMouth } from './head/mouth.mjs';
import { headWeights } from './head/rig.mjs';
import { sculpt } from './head/sculpt.mjs';
import { writeHead } from './head/write.mjs';

const GEOMETRY = path.join(
  import.meta.dirname,
  '../public/background/geometry',
);
const SOURCE = path.join(GEOMETRY, 'myHead.obj');
const OUTPUT = path.join(GEOMETRY, 'head.bin');

const MAKEHUMAN = 'makehumancommunity/makehuman';
const COMMIT = 'a8bc2d54ff0ac92e78ff71431b1023eda42bf482';
// A young man built like the reference photos: MakeHuman's even mix of its
// three race targets, its full muscle, lean, then its own targets for bigger
// pectorals, lats and deltoids and a deeper neck. Each is a path under
// MakeHuman's targets/ and a weight. The deltoids stop at 0.7: fuller, they
// made the shoulders wider than the photos; the pectorals at 1.25: past that,
// their outer edge turns into a crease.
const TARGETS = {
  'macrodetails/african-male-young': 1 / 3,
  'macrodetails/asian-male-young': 1 / 3,
  'macrodetails/caucasian-male-young': 1 / 3,
  'macrodetails/universal-male-young-maxmuscle-averageweight': 0.5,
  'macrodetails/universal-male-young-maxmuscle-minweight': 0.5,
  'torso/torso-muscle-pectoral-incr': 1.25,
  'torso/torso-muscle-dorsi-incr': 0.5,
  'armslegs/l-upperarm-shoulder-muscle-incr': 0.7,
  'armslegs/r-upperarm-shoulder-muscle-incr': 0.7,
  'neck/neck-scale-depth-incr': 0.5,
};
// MakeHuman to head-model units: a scale and offset that lay MakeHuman's head
// onto this one (checked by rendering the two heads together), so its neck
// meets this one's with only the gap the blend below closes. The body was then
// fitted to the reference photos by the steps that follow.
const SCALE = 137.5 / (9.1173 - 6.75);
const OFFSET = [0, -70 - SCALE * 6.75, -37.6];
// MakeHuman's neck is then stretched down: nothing at `from`, the full
// `length` below `to`, so the base of the throat (with the lean below) comes
// about 60 units (10 cm) below the underside of the chin (-65). Out across the shoulders (`across`, distance from the
// midline) that drop turns into a lift of `shoulders` times it, which puts
// the trapezius line where the reference photos have it.
const STRETCH = {
  from: -60,
  to: -112,
  length: 14,
  shoulders: -0.45,
  across: [25, 72],
};
// MakeHuman's body leans forward under the head more than the reference
// side photo shows: it is bent back `degrees`, about `pivot` (z, y) near the
// top of the spine, the bend growing from `from` down to `to`.
const LEAN = {
  degrees: 12,
  pivot: [-30, -40],
  from: -50,
  to: -110,
};
// The inner trapezius is raised `lift` units, most at `at` from the midline
// and over `width` either side, from the heights `below` down and behind
// `back` (z): measured on the stage photo, the traps meet the neck that much
// higher than MakeHuman's do once its neck is stretched. The lift grows over
// a tall range (`below`): grown over a short one, the neck bent sharply into
// it and left a crease at the corner, where the back photo shows a curve.
const TRAPEZIUS = {
  lift: 16,
  at: 42,
  width: 20,
  below: [45, 95],
  back: [-30, 0],
};
// The body is cut as a bust: down to `bottom` under the chest, rising to
// `arms` through the upper arms (`across`, distance from the midline), all
// below where the scene's fade ends.
const BUST = {
  bottom: -250,
  arms: -150,
  across: [100, 165],
};
const bustCut = ([x, y]) =>
  y -
  (BUST.bottom +
    (BUST.arms - BUST.bottom) * smoothstep(Math.abs(x), ...BUST.across));

// The join: a plane through the neck, tilted with it, from the back of the
// head above the stub's bottom lip (-38 at z = -56; just below, the model
// bulges out and turns in, which would leave a ridge) to the throat just below
// the chin (-76 at z = 15). It runs under the chin of both heads, so neither
// chin survives below it.
const JOIN = { back: [-56, -38], front: [15, -76] };
const joinY = (z) =>
  JOIN.back[1] +
  ((z - JOIN.back[0]) * (JOIN.front[1] - JOIN.back[1])) /
    (JOIN.front[0] - JOIN.back[0]);
const aboveJoin = ([, y, z]) => y - joinY(z);

// The body's top is bent onto the head's cut over this many units below the
// join, and left GAP below it, where a stitched band closes the seam. Under
// the chin the two are 9 units apart; over a shorter run that bend shows as a
// ring around the neck.
const BLEND = 60;
const GAP = 2;
// The seam is then rebuilt from BRIDGE_ABOVE units up the head to
// BRIDGE_BELOW down the neck (scripts/head/bridge.mjs). It starts that high
// so it takes the head's slope from above the scan's narrowing at its cut.
const BRIDGE_ABOVE = 12;
const BRIDGE_BELOW = 12;
// The bridge fades out toward the throat over this range of the sine of the
// angle around the neck (1 is straight ahead).
const BRIDGE_FRONT = [0.5, 0.85];
// Expressions are carried down the neck over the skin within CARRY.above of
// the join and the neck down to CARRY.down, within CARRY.across of the middle.
const CARRY = { above: 12, down: -125, across: 50 };
const PLEAT_REACH = 4;
const PLEAT_PASSES = 80;

const smoothstep = (x, low, high) => {
  const t = Math.min(Math.max((x - low) / (high - low), 0), 1);
  return t * t * (3 - 2 * t);
};

function readObj(text) {
  const vertices = [];
  const objects = new Map();
  let faces;
  for (const line of text.split('\n')) {
    const [kind, ...rest] = line.trim().split(/\s+/);
    if (kind === 'o') objects.set(rest.join(' '), (faces = []));
    else if (kind === 'v') vertices.push(rest.slice(0, 3).map(Number));
    else if (kind === 'f')
      faces.push(rest.map((corner) => Number(corner.split('/')[0]) - 1));
  }
  return { vertices, objects };
}

async function makehuman(file) {
  const cached = path.join(
    os.tmpdir(),
    `makehuman-${COMMIT}`,
    path.basename(file),
  );
  if (!fs.existsSync(cached)) {
    const url = `https://raw.githubusercontent.com/${MAKEHUMAN}/${COMMIT}/makehuman/data/${file}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`${url}: ${response.status}`);
    fs.mkdirSync(path.dirname(cached), { recursive: true });
    fs.writeFileSync(cached, await response.text());
  }
  return fs.readFileSync(cached, 'utf8');
}

// MakeHuman's shaped body ("body" group only; the rest is helper geometry),
// in head-model units, cut as a bust.
async function body() {
  const vertices = [];
  const faces = [];
  let group = '';
  for (const line of (await makehuman('3dobjs/base.obj')).split('\n')) {
    const [kind, ...rest] = line.trim().split(/\s+/);
    if (kind === 'v') vertices.push(rest.map(Number));
    else if (kind === 'g') group = rest.join(' ');
    else if (kind === 'f' && group === 'body')
      faces.push(rest.map((corner) => Number(corner.split('/')[0]) - 1));
  }
  for (const [name, weight] of Object.entries(TARGETS))
    for (const line of (await makehuman(`targets/${name}.target`)).split(
      '\n',
    )) {
      if (!line || line.startsWith('#')) continue;
      const [index, ...delta] = line.trim().split(/\s+/).map(Number);
      delta.forEach((d, axis) => (vertices[index][axis] += weight * d));
    }
  const placed = vertices.map((v) => {
    const [x, y, z] = v.map((c, axis) => c * SCALE + OFFSET[axis]);
    const drop =
      STRETCH.length *
      (1 -
        (1 - STRETCH.shoulders) * smoothstep(Math.abs(x), ...STRETCH.across)) *
      smoothstep(-y, -STRETCH.from, -STRETCH.to);
    // The inner trapezius, raised where it meets the neck: on the back half
    // of the shoulders only, so the hollow above the collarbone stays.
    const raise =
      TRAPEZIUS.lift *
      Math.exp(-(((Math.abs(x) - TRAPEZIUS.at) / TRAPEZIUS.width) ** 2)) *
      smoothstep(-y, ...TRAPEZIUS.below) *
      (1 - smoothstep(z, ...TRAPEZIUS.back));
    // The body leaned back under the head: a bend about the top of the
    // spine that grows over the neck, so the chest and shoulders sit where
    // the level-headed side photo has them.
    const bend =
      (LEAN.degrees * Math.PI * smoothstep(-y, -LEAN.from, -LEAN.to)) / 180;
    const dz = z - LEAN.pivot[0];
    const dy = y - drop + raise - LEAN.pivot[1];
    return [
      x,
      LEAN.pivot[1] + dy * Math.cos(bend) - dz * Math.sin(bend),
      LEAN.pivot[0] + dz * Math.cos(bend) + dy * Math.sin(bend),
    ];
  });
  // Quads well clear of the join and the bottom, smoothed twice to about the
  // head model's own density.
  const near = faces.filter((quad) =>
    quad.every((i) => aboveJoin(placed[i]) < 20 && bustCut(placed[i]) > -20),
  );
  const smoothed = subdivide(
    subdivide(compact({ vertices: placed, faces: near })),
  );
  let cut = clip(triangulate(smoothed), (p) => -aboveJoin(p));
  cut = clip(cut, bustCut);
  // The neck and everything joined to it, starting from the back of the neck.
  const nape = cut.vertices.reduce(
    (best, v, i) =>
      Math.hypot(v[0], v[1] + 100, v[2] + 50) <
      Math.hypot(...add(cut.vertices[best], [0, 100, 50]))
        ? i
        : best,
    0,
  );
  return component(cut, nape);
}

// A loop's points sorted by angle about its centre (x, z), with a lookup of
// the loop's point at any angle.
function around(vertices, loop) {
  const centre = scale(add(...loop.map((i) => vertices[i])), 1 / loop.length);
  const angleOf = ([x, , z]) => Math.atan2(z - centre[2], x - centre[0]);
  const sorted = loop
    .map((i) => ({ i, angle: angleOf(vertices[i]) }))
    .sort((a, b) => a.angle - b.angle);
  // A value given per sorted point (by default its position), at any angle.
  const at = (angle, values = sorted.map(({ i }) => vertices[i])) => {
    const k = sorted.findIndex((p) => p.angle >= angle);
    const after = k === -1 ? 0 : k;
    const before = k <= 0 ? sorted.length - 1 : k - 1;
    const span =
      (sorted[after].angle - sorted[before].angle + Math.PI * 2) %
        (Math.PI * 2) || 1;
    const t =
      ((angle - sorted[before].angle + Math.PI * 2) % (Math.PI * 2)) / span;
    return add(scale(values[before], 1 - t), scale(values[after], t));
  };
  return { sorted, at, angleOf };
}

// The loop of a mesh's open edges that sits highest (or lowest).
const loopBy = (mesh, pick) =>
  boundaryLoops(mesh)
    .map((loop) => ({
      loop,
      y: loop.reduce((s, i) => s + mesh.vertices[i][1], 0) / loop.length,
    }))
    .sort((a, b) => (pick === 'highest' ? b.y - a.y : a.y - b.y))[0].loop;

const source = readObj(fs.readFileSync(SOURCE, 'utf8'));
const mesh = (name) =>
  triangulate(
    weld(
      compact({ vertices: source.vertices, faces: source.objects.get(name) }),
    ),
  );

const scan = weld(
  compact({ vertices: source.vertices, faces: source.objects.get('skin') }),
);
// The scan with its lips parted onto a dark mouth pocket, and its
// expressions, each a move of every point (scripts/head/expressions.mjs).
const face = openMouth(scan);
const eyes = ['rightEye', 'leftEye'].map((name) => {
  const { vertices } = mesh(name);
  return [0, 1, 2].map(
    (axis) =>
      (Math.min(...vertices.map((v) => v[axis])) +
        Math.max(...vertices.map((v) => v[axis]))) /
      2,
  );
});
const moves = expressions(face, eyes, aboveJoin);
// The scan's faces are about 5 mm across, coarse enough that the glossy
// material shows each one as a facet and the scan's noise as blotchy
// reflections. One subdivision smooths both away and keeps the features.
// Subdivision is linear, so each expression's moves follow it exactly.
const allFaces = [...face.skinFaces, ...face.pocketFaces];
const skinQuads = face.skinFaces.reduce((sum, f) => sum + f.length, 0);
const fine = subdivide({ vertices: face.vertices, faces: allFaces });
const fineMoves = Object.fromEntries(
  Object.entries(moves).map(([name, d]) => {
    const posed = subdivide({
      vertices: face.vertices.map((v, i) => add(v, d[i])),
      faces: allFaces,
    });
    return [
      name,
      posed.vertices.map((v, i) => add(v, scale(fine.vertices[i], -1))),
    ];
  }),
);
const head = clip(
  triangulate({
    vertices: fine.vertices,
    faces: fine.faces.slice(0, skinQuads),
  }),
  aboveJoin,
);
const pocket = compact(
  triangulate({ vertices: fine.vertices, faces: fine.faces.slice(skinQuads) }),
);
const headLoop = around(head.vertices, loopBy(head, 'lowest'));
const neck = await body();
const neckLoopIndices = loopBy(neck, 'highest');
const neckLoop = around(neck.vertices, neckLoopIndices);

// Bend the body's top onto the head's cut, fading out over BLEND below it.
// The two cut edges are taken as smooth functions of the angle around the
// neck: a Fourier series of HARMONICS terms fitted to each. Interpolated
// straight between the edge's vertices instead, the bend would turn at every
// vertex, and each turn would run down the neck as a crease.
const HARMONICS = 24;
function fourier(sample) {
  const n = 720;
  const angles = Array.from(
    { length: n },
    (_, k) => -Math.PI + (2 * Math.PI * k) / n,
  );
  const values = angles.map(sample);
  const terms = Array.from({ length: HARMONICS + 1 }, (_, h) => [
    scale(
      add(...values.map((v, k) => scale(v, Math.cos(h * angles[k])))),
      (h ? 2 : 1) / n,
    ),
    scale(
      add(...values.map((v, k) => scale(v, Math.sin(h * angles[k])))),
      2 / n,
    ),
  ]);
  return (angle) =>
    add(
      ...terms.map(([c, si], h) =>
        add(scale(c, Math.cos(h * angle)), scale(si, Math.sin(h * angle))),
      ),
    );
}
const edge = fourier((angle) => headLoop.at(angle));
const own = fourier((angle) => neckLoop.at(angle));
const bent = neck.vertices.map((v) => {
  const angle = neckLoop.angleOf(v);
  const fade = smoothstep(-aboveJoin(v), 0, BLEND);
  const offset = add(edge(angle), scale(own(angle), -1), [0, -GAP, 0]);
  return add(v, scale(offset, 1 - fade));
});

// One mesh: head, body, and a band stitched between their two loops.
const offset = head.vertices.length;
const vertices = [...head.vertices, ...bent];
const faces = [
  ...head.faces,
  ...neck.faces.map((f) => f.map((i) => i + offset)),
];
const upper = headLoop.sorted.map(({ i, angle }) => ({ i, angle }));
const lower = neckLoopIndices
  .map((i) => ({ i: i + offset, angle: headLoop.angleOf(bent[i]) }))
  .sort((a, b) => a.angle - b.angle);
const band = [];
for (let u = 0, l = 0; u < upper.length || l < lower.length;) {
  const U = upper[u % upper.length];
  const L = lower[l % lower.length];
  const nextU = upper[(u + 1) % upper.length];
  const nextL = lower[(l + 1) % lower.length];
  const advanceUpper =
    l >= lower.length ||
    (u < upper.length &&
      nextU.angle + (u + 1 >= upper.length ? Math.PI * 2 : 0) <
        nextL.angle + (l + 1 >= lower.length ? Math.PI * 2 : 0));
  if (advanceUpper) {
    band.push([U.i, L.i, nextU.i]);
    u++;
  } else {
    band.push([U.i, L.i, nextL.i]);
    l++;
  }
}
// Wind the band like the surface around it: outward from the neck's axis.
const [a, b, c] = band[0].map((i) => vertices[i]);
const facing = (() => {
  const u = add(b, scale(a, -1));
  const w = add(c, scale(a, -1));
  const n = [
    u[1] * w[2] - u[2] * w[1],
    u[2] * w[0] - u[0] * w[2],
    u[0] * w[1] - u[1] * w[0],
  ];
  const out = add(a, scale(average(upper.map(({ i }) => vertices[i])), -1));
  return n[0] * out[0] + n[2] * out[2];
})();
faces.push(...(facing < 0 ? band.map(([p, q, r]) => [p, r, q]) : band));

// The stitched band's triangles pleat where its two edges' vertices fall out
// of step: iron that out over a few units either side of the seam.
const pleats = new Map();
vertices.forEach((v, i) => {
  const off = Math.abs(aboveJoin(v) + GAP / 2);
  if (off < PLEAT_REACH)
    pleats.set(i, 1 - smoothstep(off, PLEAT_REACH / 2, PLEAT_REACH));
});
const ironed = smooth({ vertices, faces }, pleats, PLEAT_PASSES, false);
// Then, round the back and sides, rebuild the surface across the seam so it
// turns smoothly from the head's slope to the body's. Under the chin the
// head's surface curves up into the jaw too soon for that; there the ironing
// alone joins them.
const centre = average(upper.map(({ i }) => vertices[i]));
const smoothed = {
  vertices: bridge(
    { head: head.vertices, body: bent, all: ironed.vertices },
    {
      height: aboveJoin,
      centre: [centre[0], centre[2]],
      above: BRIDGE_ABOVE,
      below: BRIDGE_BELOW,
      front: BRIDGE_FRONT,
    },
  ),
};
const skin = {
  vertices: sculpt({ vertices: smoothed.vertices, faces }),
  faces,
};

const { skinMoves, pocketMoves } = bustMoves({
  head,
  skin,
  pocket,
  fineMoves,
  free: (v, i) =>
    i < head.vertices.length
      ? aboveJoin(v) < CARRY.above
      : v[1] > CARRY.down && Math.abs(v[0]) < CARRY.across,
});
const eyeParts = ['rightEye', 'leftEye'].map((name) => {
  const part = mesh(name);
  return { name, mesh: part, normals: normals(part) };
});
writeHead(
  OUTPUT,
  [
    {
      name: 'skin',
      mesh: skin,
      normals: normals(skin),
      weights: headWeights(skin, aboveJoin),
      morphs: skinMoves,
    },
    {
      name: 'mouth',
      mesh: pocket,
      normals: normals(pocket),
      morphs: pocketMoves,
    },
    ...eyeParts,
  ],
  Object.keys(EXPRESSIONS),
);
process.stdout.write(
  `${path.relative(process.cwd(), OUTPUT)}: ${skin.vertices.length} skin vertices, ` +
    `${upper.length} + ${lower.length} seam vertices, ${band.length} band triangles\n`,
);
