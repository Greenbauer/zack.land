import { CanvasTexture, SRGBColorSpace } from 'three';

import { PRINT_EYES } from './sleepMask';

// The print on the smart bed's sleep mask (sleepMask.ts): rose satin with a
// darker piped edge, two closed eyes with long, curly lashes drooping from
// them, and a Zzz drifting up from one side. Drawn once, on a canvas the
// size of the pad's texture coordinates (u across, v up).
const W = 1024;
const H = 512;
const SATIN = '#c98a95';
const PIPING = '#8e4e63';
const INK = '#3a1630';

// A closed eye at (x, y) on the canvas, `size` across: a lid's curve, and
// lashes curling down and out from it, longer toward its outer corner
// (`out`: 1 when the outer corner is to the right).
function closedEye(
  g: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  out: 1 | -1,
) {
  g.strokeStyle = INK;
  g.lineCap = 'round';
  g.lineWidth = size * 0.07;
  g.beginPath();
  g.moveTo(x - size / 2, y);
  g.quadraticCurveTo(x, y + size * 0.32, x + size / 2, y);
  g.stroke();
  g.lineWidth = size * 0.045;
  const LASHES = 6;
  for (let k = 0; k < LASHES; k++) {
    const t = (k + 0.5) / LASHES;
    const along = (t - 0.5) * size;
    const baseY = y + size * 0.32 * 4 * t * (1 - t) * 0.5;
    // Longer toward the outer corner, each curling outward at its tip.
    const reach = size * (0.5 + 0.45 * (out > 0 ? t : 1 - t));
    const lean = (t - 0.5) * 0.9;
    g.beginPath();
    g.moveTo(x + along, baseY);
    g.bezierCurveTo(
      x + along + lean * reach * 0.4,
      baseY + reach * 0.6,
      x + along + lean * reach * 1.1 + out * reach * 0.2,
      baseY + reach * 0.95,
      x + along + lean * reach * 1.3 + out * reach * 0.45,
      baseY + reach * 0.7,
    );
    g.stroke();
  }
}

// The Zzz: three Zs, each smaller and higher, drifting up and away.
function snore(g: CanvasRenderingContext2D, x: number, y: number) {
  g.fillStyle = INK;
  g.textBaseline = 'alphabetic';
  [0, 1, 2].forEach((k) => {
    g.font = `italic 800 ${96 - k * 22}px sans-serif`;
    g.fillText('Z', x + k * 58, y - k * 62);
  });
}

export function maskPrint(): CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const g = canvas.getContext('2d')!;
  g.fillStyle = SATIN;
  g.fillRect(0, 0, W, H);
  // A soft sheen across the middle of the satin.
  const sheen = g.createLinearGradient(0, 0, 0, H);
  sheen.addColorStop(0.2, 'rgba(255,255,255,0)');
  sheen.addColorStop(0.55, 'rgba(255,240,245,0.18)');
  sheen.addColorStop(0.9, 'rgba(255,255,255,0)');
  g.fillStyle = sheen;
  g.fillRect(0, 0, W, H);
  // The piping round the pad's top and bottom edges.
  g.fillStyle = PIPING;
  g.fillRect(0, 0, W, 18);
  // The eyes, a little above the real ones so their lashes hang over them
  // and stay on the pad: texture v runs up, the canvas down.
  const size = W * 0.2;
  const y = (1 - PRINT_EYES.v) * H - H * 0.12;
  closedEye(g, (1 - PRINT_EYES.u) * W, y, size, -1);
  closedEye(g, PRINT_EYES.u * W, y, size, 1);
  // Between the eyes, drifting up and to the right.
  snore(g, W / 2 - size * 0.05, y - size * 0.05);
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}
