// Turned to the side, the skin under the chin turns with the jaw while the
// larynx below it stays (rig.mjs turnWeights), so seen from the side the
// throat above the Adam's apple fell away and the apple stood out of it
// half as far again as at rest (2.7 units at rest, 4.2 turned 47 degrees).
// A real neck's skin there runs from the jaw down to the larynx without the
// hollow. So the turn shapes fill it: a few swells down the front of the
// throat (FILL: centred every 4 units of height, each falling away over
// `height`, on the skin that the turn brings round to the front, falling away
// over `around` radians either side), their depths fitted so that, turned,
// the outline above the apple dips below it no further than at rest.

import { bump } from './falloff.mjs';
import { around, axisZ, radial, twisted } from './neckAxis.mjs';

const FILL = { centres: [-70, -74, -78, -82, -86], height: 5, around: 0.6 };
// The throat's front, where the fill and the outline are measured.
const REGION = { top: -60, bottom: -100, across: 40 };
// The apple's height range, and the heights above it held to the outline.
const APPLE = [-84, -92];
const ROWS = [-74, -76, -78, -80, -82, -84];
const ROUNDS = 6;

// The fill's move of every point of the skin for a turn of the neck by
// `angle` toward `toward` (+1 for +x), given the turn shape's other moves
// (`moves`), each point's share of the turn (`turns`), and `even` (the turn
// shapes' evening, holding `held`).
export function throatFill(skin, turns, moves, angle, toward, even) {
  const { vertices } = skin;
  const region = vertices.flatMap(([x, y, z], i) =>
    y < REGION.top &&
    y > REGION.bottom &&
    Math.abs(x) < REGION.across &&
    z > axisZ(y)
      ? [i]
      : [],
  );
  const inRegion = new Set(region);
  const a = (i) => toward * angle * turns[i];
  const shapes = FILL.centres.map((c) =>
    even(
      vertices.map((p, i) => {
        const turnedAround = around(twisted(p, a(i)));
        const g = bump(p[1] - c, FILL.height) * bump(turnedAround, FILL.around);
        return inRegion.has(i) ? radial(p).map((r) => r * g) : [0, 0, 0];
      }),
    ),
  );
  // The outline seen from the side: the front-most point within 1.2 of y.
  const outline = (points, y) => {
    let front = -Infinity;
    for (const i of region)
      if (Math.abs(points[i][1] - y) < 1.2)
        front = Math.max(front, points[i][2]);
    return front;
  };
  const rest = (y) => outline(vertices, y);
  const apple = (f) => {
    let best = -Infinity;
    for (let y = APPLE[0]; y >= APPLE[1]; y -= 2) best = Math.max(best, f(y));
    return best;
  };
  const restApple = apple(rest);
  const posed = (depths) =>
    vertices.map((p, i) =>
      twisted(
        p.map(
          (c, k) =>
            c +
            moves[i][k] +
            depths.reduce((s, d, n) => s + d * shapes[n][i][k], 0),
        ),
        a(i),
      ),
    );
  // How far each row's outline falls short of where it should be.
  const short = (depths) => {
    const points = posed(depths);
    const top = apple((y) => outline(points, y));
    return ROWS.map((y) =>
      Math.max(0, top - Math.max(0, restApple - rest(y)) - outline(points, y)),
    );
  };
  let depths = FILL.centres.map(() => 0);
  for (let round = 0; round < ROUNDS; round++) {
    const base = short(depths);
    if (base.every((s) => s < 0.05)) break;
    // Each swell's effect on the shortfall, and the step that most reduces
    // it, kept to swells that fill (no negative depths).
    const columns = depths.map((_, k) => {
      const nudged = depths.map((d, j) => d + (j === k ? 1 : 0));
      return short(nudged).map((s, r) => base[r] - s);
    });
    depths = depths.map((d, k) => {
      const col = columns[k];
      const gain = col.reduce((s, c, r) => s + c * base[r], 0);
      const size = col.reduce((s, c) => s + c * c, 0) + 0.05;
      return Math.max(0, d + gain / size / depths.length);
    });
  }
  return vertices.map((_, i) =>
    [0, 1, 2].map((k) =>
      depths.reduce((s, d, n) => s + d * shapes[n][i][k], 0),
    ),
  );
}
