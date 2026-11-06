// The neck's shapes as the head turns and nods, carried from the pose
// correctives of Meta's Momentum Human Rig (MHR, Apache 2.0:
// github.com/facebookresearch/MHR), which it learned from body scans: how the
// skin of a real neck, the muscles either side of it and the top of the
// shoulders bunch and stretch as the head moves, over and above turning
// with the bones. Extracted by scripts/head/extract-mhr.py into ./mhr.
//
// How: MHR's neck is placed on ours (scaled from centimetres, its head's top
// and neck lined up, then fitted point to nearest point over the neck), and
// each of our points takes the offset of the MHR points nearest it.

import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

import { gridOf, similarity } from './align.mjs';

// Centimetres to our units (about 1.7 mm each).
const SCALE = 10 / 1.7;
// MHR's points fitted to ours: those on the neck and below the head (cm),
// over this many rounds, matched to our nearest within `reach` (units).
const FIT = { from: 128, to: 160, rounds: 30, reach: [20, 4] };
// Each of our points takes the average offset of MHR's points within this
// many units, nearer ones counting more.
const SPREAD = 4;

const load = () =>
  JSON.parse(
    zlib.gunzipSync(
      fs.readFileSync(path.join(import.meta.dirname, 'mhr', 'neck.json.gz')),
    ),
  );
const triples = (flat) =>
  Array.from({ length: flat.length / 3 }, (_, i) =>
    flat.slice(i * 3, i * 3 + 3),
  );

// MHR's points placed on our skin.
function place(mhr, skin) {
  const top = Math.max(...skin.vertices.map((v) => v[1]));
  const mhrTop = Math.max(...mhr.map((v) => v[1]));
  const centre = (points, y, r) => {
    const near = points.filter((p) => Math.abs(p[1] - y) < r);
    return [0, 2].map((k) => near.reduce((s, p) => s + p[k], 0) / near.length);
  };
  // Lined up at the top of the head and the middle of the neck.
  const [, ourZ] = centre(skin.vertices, -90, 3);
  const [, mhrZ] = centre(mhr, mhrTop - 20, 0.5);
  let toOurs = (p) => [
    p[0] * SCALE,
    top + (p[1] - mhrTop) * SCALE,
    ourZ + (p[2] - mhrZ) * SCALE,
  ];
  let turn = (d) => d.map((c) => c * SCALE);
  const ours = gridOf(skin.vertices);
  const fitted = mhr.flatMap((p, i) =>
    p[1] > FIT.from && p[1] < FIT.to ? [i] : [],
  );
  for (let round = 0; round < FIT.rounds; round++) {
    const reach =
      FIT.reach[0] + ((FIT.reach[1] - FIT.reach[0]) * round) / FIT.rounds;
    const from = [];
    const to = [];
    for (const i of fitted) {
      const [j] = ours(toOurs(mhr[i]), reach);
      if (j < 0) continue;
      from.push(mhr[i]);
      to.push(skin.vertices[j]);
    }
    ({ place: toOurs, turn } = similarity(from, to));
  }
  return { points: mhr.map(toOurs), turn };
}

// Each named neck shape's move of every point of `skin`, times `keep(p)`.
export function mhrNeck(skin, keep) {
  const data = load();
  const { points, turn } = place(triples(data.vertices), skin);
  const near = gridOf(points);
  const shapes = Object.fromEntries(
    Object.entries(data.shapes).map(([name, flat]) => [
      name,
      triples(flat).map(turn),
    ]),
  );
  // Which of MHR's points each of ours draws on, and how much.
  const draws = skin.vertices.map((v) => {
    const found = [];
    let r = SPREAD;
    for (;;) {
      const [i, d] = near(v, r, (k) => !found.some(([j]) => j === k));
      if (i < 0 || found.length >= 6) break;
      found.push([i, 1 / (d + 0.5)]);
      r = SPREAD;
    }
    return found;
  });
  return Object.fromEntries(
    Object.entries(shapes).map(([name, offsets]) => [
      name,
      draws.map((found, v) => {
        const total = found.reduce((s, [, w]) => s + w, 0);
        const share = total ? keep(skin.vertices[v]) / total : 0;
        return [0, 1, 2].map(
          (k) => found.reduce((s, [i, w]) => s + offsets[i][k] * w, 0) * share,
        );
      }),
    ]),
  );
}
