import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';

import { backdropWatchers, relativeLuminance } from './backdrop';

// Every this many frames, reads back the rendered pixels behind each watched
// element (backdrop.ts) and reports their luminance: a grid of samples across
// it.
const EVERY = 6;
const GRID = 12;

// Runs after the colour grading draws the frame (priority 1), so it reads
// the final picture, before the browser shows it.
const PRIORITY = 2;

export default function BackdropSampler() {
  const frame = useRef(0);

  useFrame(({ gl }) => {
    frame.current = (frame.current + 1) % EVERY;
    if (frame.current || backdropWatchers().size === 0) return;
    const canvas = gl.domElement;
    const bounds = canvas.getBoundingClientRect();
    const scale = canvas.width / bounds.width;
    const context = gl.getContext();
    const pixel = new Uint8Array(4);
    const sample = (x: number, y: number) => {
      const px = Math.round((x - bounds.left) * scale);
      const py = Math.round((bounds.bottom - y) * scale);
      if (px < 0 || py < 0 || px >= canvas.width || py >= canvas.height)
        return null;
      context.readPixels(
        px,
        py,
        1,
        1,
        context.RGBA,
        context.UNSIGNED_BYTE,
        pixel,
      );
      return relativeLuminance(pixel[0]!, pixel[1]!, pixel[2]!);
    };
    for (const { element, onLuminance } of backdropWatchers()) {
      const box = element.getBoundingClientRect();
      const samples: number[] = [];
      for (let i = 0; i < GRID; i++)
        for (let j = 0; j < GRID / 3; j++) {
          const l = sample(
            box.left + ((i + 0.5) / GRID) * box.width,
            box.top + ((j + 0.5) / (GRID / 3)) * box.height,
          );
          if (l !== null) samples.push(l);
        }
      if (samples.length) onLuminance(samples);
    }
  }, PRIORITY);

  return null;
}
