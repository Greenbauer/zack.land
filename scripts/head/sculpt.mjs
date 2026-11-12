// Forms MakeHuman's bust lacks, added to the joined surface as broad, soft
// swellings and hollows that fade to nothing at their edges. Each is kept low
// and wide: on the glossy material any narrow bump shows as a hard-edged
// highlight. Heights and sizes are in head.bin units (the underside of the
// chin at -65, the notch at the base of the throat near -124, about 1.7 mm a
// unit).

import { fitBack } from './backOutline.mjs';
import { bump, smoothstep } from './falloff.mjs';
import { edgeNeighbours, normals } from './mesh.mjs';

// An Adam's apple (MakeHuman has none), a little over a third of the way
// from the chin to the notch.
const ADAMS_APPLE = { y: -88, height: 6, width: 6, depth: 3.5 };
// The base of the back of the neck filled out, so the back runs straight
// down from the skull into the shoulders instead of dipping in just above
// them: `depth` deep between the two ramps, rising in over `top` and out over
// `bottom`.
const NAPE = { top: [-72, -90], bottom: [-135, -96], width: 30, depth: 2.6 };

// The back below the neck, evened out first (`passes` times, a Taubin
// smoothing that keeps its size): MakeHuman's base carries faint creases down
// the upper back and a notch across the base of the neck that no real back
// shows. It reaches up over the back of the trapezius (`below`), rounding
// where the raised trapezius turns over into the back, but only where the
// surface faces backward, so the trapezius's top, which the photos fix, keeps
// its height; and it stays clear of the bust's cut edge.
const BACK_SMOOTH = {
  passes: 160,
  below: [66, 90],
  across: [105, 130],
};
// The same for the front of the base of the neck and the collarbones, where
// the surface faces forward (`below` and `above`, heights fading in and out,
// and `across`): it left the notch at the base of the throat a
// cluster of small lumps where the collarbones' inner ends met the chest's
// fill, and a dimple at the outer end of each collarbone, which showed in
// every pose; a real notch is one smooth hollow. Evened after the sculpting
// below, which made them.
const FRONT_SMOOTH = {
  passes: 40,
  below: [94, 104],
  above: [140, 152],
  across: [95, 115],
};
// Then the one form a real back shows there: the groove down the spine
// between the muscles either side of it, shallow between the shoulder blades
// and deepening below (`depth` reached at `full`), about `width` across.
const SPINE = { start: -105, full: -215, depth: 3.4, width: 8 };
// MakeHuman's upper back is a deep trough between two humps over the
// shoulder blades (the spine some 21 units in front of them at -140); a real
// back is full there, the muscles between the blades filling it. Filled
// `depth` at the spine, over `width` either side, from `top` down to `bottom`.
// The upper trapezius thickened behind and below its top (whose height the
// photos fix): `depth` most at `at` from the midline, over `width` either
// side, from `top` down to `bottom`.
const TRAPEZIUS = {
  depth: 4,
  at: 40,
  width: 22,
  top: [-60, -105],
  bottom: [-105, -140],
};
const BETWEEN_BLADES = {
  depth: 17,
  width: 26,
  top: [-88, -135],
  bottom: [-145, -195],
};

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
  width: 9,
  height: 2,
  // The hollow above each, between the neck and the trapezius: `above` its
  // line, `from` and `to` from the midline.
  hollow: {
    above: 10,
    width: 9,
    depth: 1,
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

// The skin evened out where `reach(p, normal)` (0 to 1) says, `passes` times.
function even(vertices, faces, reach, passes) {
  const near = edgeNeighbours({ vertices, faces });
  const n = normals({ vertices, faces });
  const weight = vertices.map((p, i) => reach(p, n[i]));
  let p = vertices.map((v) => [...v]);
  const step = (factor) =>
    p.map((v, i) => {
      if (!weight[i] || !near[i].size) return v;
      const mean = [0, 0, 0];
      for (const j of near[i]) for (let a = 0; a < 3; a++) mean[a] += p[j][a];
      return v.map(
        (c, a) => c + factor * weight[i] * (mean[a] / near[i].size - c),
      );
    });
  for (let pass = 0; pass < passes; pass++) {
    p = step(0.5);
    p = step(-0.53);
  }
  return p;
}

export function sculpt({ vertices: start, faces }) {
  const vertices = even(
    start,
    faces,
    ([x, y], n) =>
      smoothstep(-n[2], 0.1, 0.4) *
      smoothstep(-y, ...BACK_SMOOTH.below) *
      (1 - smoothstep(Math.abs(x), ...BACK_SMOOTH.across)) *
      (1 - smoothstep(-y, 178, 192)),
    BACK_SMOOTH.passes,
  );
  const line = clavicleLine(vertices);
  const n = normals({ vertices, faces });
  const ends = [line[0][0], line.at(-1)[0]];
  // Last, the back's outline seen from the side, shaped to the side photo
  // (backOutline.mjs).
  const shaped = vertices.map(([x, y, z], i) => {
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
    // Behind the neck's middle, by depth rather than by which way the
    // surface faces: that turns quickly over the top of the trapezius and
    // left a hard line along it.
    const behind = smoothstep(-z, 30, 60);
    const back =
      BETWEEN_BLADES.depth *
        behind *
        bump(x, BETWEEN_BLADES.width) *
        smoothstep(-y, -BETWEEN_BLADES.top[0], -BETWEEN_BLADES.top[1]) *
        (1 -
          smoothstep(
            -y,
            -BETWEEN_BLADES.bottom[0],
            -BETWEEN_BLADES.bottom[1],
          )) +
      TRAPEZIUS.depth *
        behind *
        bump(Math.abs(x) - TRAPEZIUS.at, TRAPEZIUS.width) *
        smoothstep(-y, -TRAPEZIUS.top[0], -TRAPEZIUS.top[1]) *
        (1 - smoothstep(-y, -TRAPEZIUS.bottom[0], -TRAPEZIUS.bottom[1])) -
      SPINE.depth *
        behind *
        bump(x, SPINE.width) *
        smoothstep(-y, -SPINE.start, -SPINE.full);
    [x, y, z] = [0, 1, 2].map(
      (axis) => [x, y, z][axis] + n[i][axis] * (ridge + back),
    );

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
  // Then the front of the base of the neck evened out (FRONT_SMOOTH).
  const front = even(
    shaped,
    faces,
    ([x, y], n) =>
      smoothstep(n[2], 0.1, 0.4) *
      smoothstep(-y, ...FRONT_SMOOTH.below) *
      (1 - smoothstep(-y, ...FRONT_SMOOTH.above)) *
      (1 - smoothstep(Math.abs(x), ...FRONT_SMOOTH.across)),
    FRONT_SMOOTH.passes,
  );
  return fitBack(front, faces);
}
