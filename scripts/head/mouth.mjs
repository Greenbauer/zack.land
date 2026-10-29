// Opens the scan's mouth. The scan's lips are joined by a thin strip of faces
// along the lip line; removing it parts them exactly where they meet, and a
// pocket stepping back from the lip edge closes the opening behind them. The
// page draws the pocket flat dark, so the mouth shows no teeth or tongue.

import { boundaryLoops, compact } from './mesh.mjs';

// The strip: faces at the front of the mouth, under 0.8 units tall.
const isLipStrip = (vertices) => (face) => {
  const points = face.map((i) => vertices[i]);
  const ys = points.map((v) => v[1]);
  const [x, y, z] = [0, 1, 2].map(
    (axis) => points.reduce((sum, v) => sum + v[axis], 0) / points.length,
  );
  return (
    z > 25 &&
    Math.abs(x) < 20 &&
    y < -35 &&
    y > -41 &&
    Math.max(...ys) - Math.min(...ys) < 0.8
  );
};

// Rings of the pocket: how far back from the lip edge, and how much of the
// lip edge's spread each keeps (taller than wide, so it reads as a throat).
const RINGS = [
  [3, 0.85],
  [7, 0.6],
  [11, 0.3],
];
const BACK = 14;

// The scan's skin (welded, polygons) with its lips parted. Returns its
// vertices, the skin's faces, the pocket's faces (sharing the lip edge's
// vertices), and the lip edge split into upper, lower and the two corners.
export function openMouth(scan) {
  const strip = isLipStrip(scan.vertices);
  const opened = compact({
    vertices: scan.vertices,
    faces: scan.faces.filter((face) => !strip(face)),
  });
  const vertices = opened.vertices.map((v) => [...v]);
  const edge = boundaryLoops(opened).find((loop) => vertices[loop[0]][1] < -30);
  const centre = [0, 1, 2].map(
    (axis) => edge.reduce((sum, i) => sum + vertices[i][axis], 0) / edge.length,
  );
  const pocket = [];
  let previous = edge;
  for (const [depth, spread] of RINGS) {
    const ring = edge.map((i) => {
      const [x, y, z] = vertices[i];
      vertices.push([
        centre[0] + (x - centre[0]) * spread,
        centre[1] + (y - centre[1]) * spread * 1.6,
        z - depth,
      ]);
      return vertices.length - 1;
    });
    ring.forEach((_, k) => {
      const next = (k + 1) % ring.length;
      pocket.push([previous[k], previous[next], ring[next], ring[k]]);
    });
    previous = ring;
  }
  vertices.push([centre[0], centre[1], centre[2] - BACK]);
  const back = vertices.length - 1;
  previous.forEach((_, k) =>
    pocket.push([previous[k], previous[(k + 1) % previous.length], back]),
  );
  // Wind the pocket like the skin it continues: each lip edge is walked one
  // way by the skin's faces and must be walked the other way by the pocket's.
  const walked = new Set();
  for (const face of opened.faces)
    face.forEach((a, k) => walked.add(`${a},${face[(k + 1) % face.length]}`));
  if (walked.has(`${pocket[0][0]},${pocket[0][1]}`))
    for (const face of pocket) face.reverse();

  // The lip edge's two halves between the corners: the higher is the upper lip.
  const xs = edge.map((i) => vertices[i][0]);
  const left = xs.indexOf(Math.min(...xs));
  const right = xs.indexOf(Math.max(...xs));
  const between = (from, to) => {
    const out = [];
    for (let k = (from + 1) % edge.length; k !== to; k = (k + 1) % edge.length)
      out.push(edge[k]);
    return out;
  };
  const meanY = (half) =>
    half.reduce((sum, i) => sum + vertices[i][1], 0) / half.length;
  const [a, b] = [between(left, right), between(right, left)];
  const [upper, lower] = meanY(a) > meanY(b) ? [a, b] : [b, a];
  return {
    vertices,
    skinFaces: opened.faces,
    pocketFaces: pocket,
    lips: { upper, lower, corners: [edge[left], edge[right]] },
  };
}
