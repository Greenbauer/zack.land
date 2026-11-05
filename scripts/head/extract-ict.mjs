// Extracts what the head's scanned expressions need from a checkout of
// ICT-FaceKit (github.com/VGL-Group/ICT-FaceKit, MIT, USC Institute for
// Creative Technologies): the face and the back of the head of its generic
// neutral mesh (FaceXModel/generic_neutral_mesh.obj), its 68 facial
// landmarks (vertex_indices.json), and the moves of the shapes named in
// ICT_SHAPES (scripts/head/ict.mjs), into scripts/head/ict/face.json.gz. The
// build reads that file (scripts/head/ict.mjs); the 220 MB checkout is not
// needed to build.
//
//   node scripts/head/extract-ict.mjs <ICT-FaceKit checkout>

import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

import { ICT_SHAPES } from './ict.mjs';

const [checkout] = process.argv.slice(2);
if (!checkout) throw new Error('usage: extract-ict.mjs <ICT-FaceKit checkout>');
const model = path.join(checkout, 'FaceXModel');
const OUT = path.join(import.meta.dirname, 'ict');

// The vertices of an OBJ, and the triangles of the given materials.
function readObj(file, materials) {
  const vertices = [];
  const faces = [];
  let material = '';
  for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
    const [kind, ...rest] = line.trim().split(/\s+/);
    if (kind === 'v') vertices.push(rest.map(Number));
    else if (kind === 'usemtl') material = rest[0];
    else if (kind === 'f' && materials?.includes(material)) {
      const ids = rest.map((s) => Number(s.split('/')[0]) - 1);
      for (let k = 1; k + 1 < ids.length; k++)
        faces.push([ids[0], ids[k], ids[k + 1]]);
    }
  }
  return { vertices, faces };
}

const neutral = readObj(path.join(model, 'generic_neutral_mesh.obj'), [
  'M_Face',
  'M_BackHead',
]);
// Only the vertices those triangles use, renumbered.
const used = [...new Set(neutral.faces.flat())].sort((a, b) => a - b);
const local = new Map(used.map((g, i) => [g, i]));
const round = (x) => Math.round(x * 1e5) / 1e5;
const { idx_to_landmark_verts: landmarks } = JSON.parse(
  fs.readFileSync(path.join(model, 'vertex_indices.json'), 'utf8'),
);
const names = [
  ...new Set(Object.values(ICT_SHAPES).flatMap((mix) => Object.keys(mix))),
];
const shapes = Object.fromEntries(
  names.map((name) => {
    const { vertices } = readObj(path.join(model, `${name}.obj`));
    // Sparse: [local index, dx, dy, dz] for each vertex that moves.
    return [
      name,
      used.flatMap((g, i) => {
        const d = vertices[g].map((c, a) => round(c - neutral.vertices[g][a]));
        return Math.hypot(...d) > 1e-4 ? [[i, ...d]] : [];
      }),
    ];
  }),
);
fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(
  path.join(OUT, 'face.json.gz'),
  zlib.gzipSync(
    JSON.stringify({
      vertices: used.map((g) => neutral.vertices[g].map(round)),
      faces: neutral.faces.map((f) => f.map((g) => local.get(g))),
      landmarks: landmarks.map((g) => local.get(g)),
      shapes,
    }),
  ),
);
fs.copyFileSync(path.join(checkout, 'LICENSE'), path.join(OUT, 'LICENSE'));
process.stdout.write(
  `${path.relative(process.cwd(), OUT)}/face.json.gz: ${used.length} vertices, ${names.length} shapes\n`,
);
