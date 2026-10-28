import { useFrame, useThree } from '@react-three/fiber';
import { useRef } from 'react';

import { backdropWatchers, relativeLuminance, type Watcher } from './backdrop';
import usePixelReader from './usePixelReader';

// A few times a second, reads back the rendered pixels behind each watched
// element (backdrop.ts) and reports their luminance: a grid of samples across
// it, each row of the grid read as one strip of the frame (pixelReader.ts),
// reported when the strips arrive.
const EVERY = 6;
const GRID = 12;
const ROWS = GRID / 3;

// Runs after the colour grading draws the frame (priority 1), so it reads
// the final picture, before the browser shows it.
const PRIORITY = 2;

export default function BackdropSampler() {
  const gl = useThree((state) => state.gl);
  const reader = usePixelReader();
  const frame = useRef(0);

  useFrame(() => {
    frame.current = (frame.current + 1) % EVERY;
    if (frame.current || reader.busy || backdropWatchers().size === 0) return;
    const canvas = gl.domElement;
    const bounds = canvas.getBoundingClientRect();
    const scale = canvas.width / bounds.width;
    // Each watcher read, with its samples' columns (device pixels into its
    // strips) and how many strips it has.
    const reads: { watcher: Watcher; columns: number[]; rows: number }[] = [];
    for (const watcher of backdropWatchers()) {
      const box = watcher.element.getBoundingClientRect();
      const xs = Array.from({ length: GRID }, (_, i) =>
        Math.round(
          (box.left - bounds.left + ((i + 0.5) / GRID) * box.width) * scale,
        ),
      ).filter((px) => px >= 0 && px < canvas.width);
      const rows = Array.from({ length: ROWS }, (_, j) =>
        Math.round(
          (bounds.bottom - (box.top + ((j + 0.5) / ROWS) * box.height)) * scale,
        ),
      ).filter((py) => py >= 0 && py < canvas.height);
      if (!xs.length || !rows.length) continue;
      const left = xs[0]!;
      const width = xs[xs.length - 1]! - left + 1;
      for (const py of rows) reader.read({ x: left, y: py, width, height: 1 });
      reads.push({
        watcher,
        columns: xs.map((px) => px - left),
        rows: rows.length,
      });
    }
    reader.send((strips) => {
      let at = 0;
      for (const { watcher, columns, rows } of reads) {
        const samples = strips
          .slice(at, (at += rows))
          .flatMap((strip) =>
            columns.map((x) =>
              relativeLuminance(
                strip[x * 4]!,
                strip[x * 4 + 1]!,
                strip[x * 4 + 2]!,
              ),
            ),
          );
        // An element gone since it was read takes no report.
        if (backdropWatchers().has(watcher)) watcher.onLuminance(samples);
      }
    });
  }, PRIORITY);

  return null;
}
