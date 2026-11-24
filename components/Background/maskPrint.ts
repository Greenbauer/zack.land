import { CanvasTexture, SRGBColorSpace, Vector2 } from 'three';

import { lidAt, maskOutline, outlineBounds } from './sleepMask';

// The print on the smart bed's sleep mask (sleepMask.ts): the mask's outline
// (its alpha cuts the pad to that shape), rose satin with a soft sheen, a
// stitched edge round it, and the two closed eyes' lid lines the 3D lashes
// grow from. Drawn once on a canvas spanning the outline's bounds.
const W = 1024;
const H = 420;
const SATIN = '#d6a0ab';
const SHADE = '#b97c8a';
const STITCH = '#8e4e63';
const INK = '#3a1630';

export function maskPrint(): CanvasTexture {
  const outline = maskOutline();
  const b = outlineBounds(outline);
  const toCanvas = (p: Vector2): [number, number] => [
    ((p.x - b.left) / (b.right - b.left)) * W,
    (1 - (p.y - b.low) / (b.high - b.low)) * H,
  ];
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const g = canvas.getContext('2d')!;
  const trace = (points: Vector2[]) => {
    g.beginPath();
    points.forEach((p, k) => {
      const [x, y] = toCanvas(p);
      if (k) g.lineTo(x, y);
      else g.moveTo(x, y);
    });
    g.closePath();
  };
  // The satin, darker toward its edges, lighter across its middle.
  trace(outline);
  const satin = g.createRadialGradient(
    W / 2,
    H * 0.45,
    H * 0.1,
    W / 2,
    H * 0.45,
    W * 0.55,
  );
  satin.addColorStop(0, SATIN);
  satin.addColorStop(1, SHADE);
  g.fillStyle = satin;
  g.fill();
  const sheen = g.createLinearGradient(0, 0, 0, H);
  sheen.addColorStop(0.15, 'rgba(255,255,255,0)');
  sheen.addColorStop(0.4, 'rgba(255,240,245,0.22)');
  sheen.addColorStop(0.7, 'rgba(255,255,255,0)');
  g.fillStyle = sheen;
  g.fill();
  // The stitched edge, just inside the outline.
  g.save();
  g.clip();
  trace(outline);
  g.strokeStyle = STITCH;
  g.lineWidth = 22;
  g.stroke();
  g.setLineDash([10, 8]);
  g.strokeStyle = '#f3d5dc';
  g.lineWidth = 3;
  trace(outline.map((p) => p.clone().multiplyScalar(0.96)));
  g.stroke();
  g.restore();
  // The closed lids.
  g.setLineDash([]);
  g.strokeStyle = INK;
  g.lineCap = 'round';
  g.lineWidth = 12;
  for (const side of [-1, 1] as const) {
    g.beginPath();
    for (let k = 0; k <= 24; k++) {
      const [x, y] = toCanvas(lidAt(side, -1 + k / 12));
      if (k) g.lineTo(x, y);
      else g.moveTo(x, y);
    }
    g.stroke();
  }
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}
