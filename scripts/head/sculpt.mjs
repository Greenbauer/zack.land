// Forms MakeHuman's bust lacks, added to the joined surface as broad, soft
// swellings and hollows that fade to nothing at their edges. Each is kept low
// and wide: on the glossy material any narrow bump shows as a hard-edged
// highlight. Heights and sizes are in head.bin units (the underside of the
// chin at -65, the notch at the base of the throat near -124, about 1.7 mm a
// unit).

import { normals } from './mesh.mjs';

const smoothstep = (x, low, high) => {
  const t = Math.min(Math.max((x - low) / (high - low), 0), 1);
  return t * t * (3 - 2 * t);
};
const bump = (d, width) => Math.exp(-((d / width) ** 2));

// An Adam's apple (MakeHuman has none), a little over a third of the way
// from the chin to the notch.
const ADAMS_APPLE = { y: -88, height: 6, width: 6, depth: 3.5 };
// The base of the back of the neck filled out, so the back runs straight
// down from the skull into the shoulders instead of dipping in just above
// them: `depth` deep between the two ramps, rising in over `top` and out over
// `bottom`.
const NAPE = { top: [-72, -90], bottom: [-106, -96], width: 30, depth: 2.6 };

// Each collarbone: a low ridge along the front of the shoulder, through
// these (distance from the midline, height) points, placed on the surface's
// front; `width` is its spread either side of that line and `height` how far
// it stands out. It starts beside the notch at the base of the throat (-124)
// and rises toward the shoulder as the stage photo's lighting shows.
const CLAVICLE = {
  path: [
    [9, -120],
    [30, -117],
    [54, -113],
    [79, -110],
  ],
  width: 6,
  height: 2.6,
  // The hollow above each, between the neck and the trapezius: `above` its
  // line, `from` and `to` from the midline.
  hollow: {
    above: 9,
    width: 7,
    depth: 1.6,
    from: 18,
    to: 62,
  },
  // The top of the pectoral filled out just below each: the reference photos
  // show the chest running on down from the collarbone, with no hollow under
  // it. `below` its line, `from` and `to` from the midline.
  chest: {
    below: 12,
    width: 10,
    depth: 3.5,
    from: 6,
    to: 66,
  },
};

// A line up the inside of the neck, leaning forward as it rises, that the
// Adam's apple and the nape fill push straight out from. Their sizes were
// tuned around it as it is: it runs in front of the neck's true middle, 5
// units at -72 and 16 at -120, since the body was leaned back after it was
// set.
const centre = (y) => -20 + (y + 72) * 0.2;

// The collarbone line on the surface: each path point at the front of the
// surface there, joined by straight segments.
function clavicleLine(vertices) {
  return CLAVICLE.path.map(([across, y]) => {
    const near = vertices.filter(
      (v) => Math.abs(v[0] - across) < 2 && Math.abs(v[1] - y) < 2,
    );
    const front = near.reduce((best, v) => (v[2] > best[2] ? v : best));
    return [across, y, front[2]];
  });
}

// The distance from p to the line moved `shift` units up, and how far out
// from the midline the closest point on it lies. Measured to the segments
// exactly: to a chain of sample points instead, the distance kinks wherever
// the closest sample changes, and a push grown from it comes out jagged.
function toLine(line, p, shift) {
  let best = { distance: Infinity, along: 0 };
  for (let k = 0; k + 1 < line.length; k++) {
    const a = [line[k][0], line[k][1] + shift, line[k][2]];
    const b = [line[k + 1][0], line[k + 1][1] + shift, line[k + 1][2]];
    const ab = b.map((c, axis) => c - a[axis]);
    const t = Math.min(
      Math.max(
        ab.reduce((sum, c, axis) => sum + c * (p[axis] - a[axis]), 0) /
          ab.reduce((sum, c) => sum + c * c, 0),
        0,
      ),
      1,
    );
    const closest = a.map((c, axis) => c + ab[axis] * t);
    const distance = Math.hypot(...closest.map((c, axis) => c - p[axis]));
    if (distance < best.distance) best = { distance, along: closest[0] };
  }
  return best;
}

export function sculpt({ vertices, faces }) {
  const line = clavicleLine(vertices);
  const n = normals({ vertices, faces });
  const ends = [line[0][0], line.at(-1)[0]];
  return vertices.map(([x, y, z], i) => {
    // The collarbones, tapering in at each end, pushed out along the surface.
    const mirrored = [Math.abs(x), y, z];
    const { distance: nearest, along } = toLine(line, mirrored, 0);
    const { distance: hollowNearest, along: hollowAlong } = toLine(
      line,
      mirrored,
      CLAVICLE.hollow.above,
    );
    const { distance: chestNearest, along: chestAlong } = toLine(
      line,
      mirrored,
      -CLAVICLE.chest.below,
    );
    const ridge =
      CLAVICLE.height *
        bump(nearest, CLAVICLE.width) *
        smoothstep(along, ends[0], ends[0] + 6) *
        (1 - smoothstep(along, ends[1] - 10, ends[1])) -
      CLAVICLE.hollow.depth *
        bump(hollowNearest, CLAVICLE.hollow.width) *
        smoothstep(
          hollowAlong,
          CLAVICLE.hollow.from,
          CLAVICLE.hollow.from + 10,
        ) *
        (1 -
          smoothstep(
            hollowAlong,
            CLAVICLE.hollow.to - 15,
            CLAVICLE.hollow.to,
          )) +
      CLAVICLE.chest.depth *
        bump(chestNearest, CLAVICLE.chest.width) *
        smoothstep(chestAlong, CLAVICLE.chest.from, CLAVICLE.chest.from + 8) *
        (1 - smoothstep(chestAlong, CLAVICLE.chest.to - 15, CLAVICLE.chest.to));
    [x, y, z] = [0, 1, 2].map((axis) => [x, y, z][axis] + n[i][axis] * ridge);

    const dz = z - centre(y);
    const radius = Math.hypot(x, dz);
    if (!radius) return [x, y, z];
    const turn = Math.atan2(Math.abs(x), dz);
    const push =
      ADAMS_APPLE.depth *
        bump(turn * radius, ADAMS_APPLE.width) *
        bump(y - ADAMS_APPLE.y, ADAMS_APPLE.height) +
      NAPE.depth *
        bump((Math.PI - turn) * radius, NAPE.width) *
        smoothstep(-y, -NAPE.top[0], -NAPE.top[1]) *
        smoothstep(y, ...NAPE.bottom);
    return [x + (x / radius) * push, y, z + (dz / radius) * push];
  });
}
