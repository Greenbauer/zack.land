import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useState } from 'react';

import { PixelReader } from './pixelReader';

// Arrived batches are fetched once the frame is drawn, as the reads are made
// (after the colour grading, priority 1). Fetched before the frame instead,
// Chrome holds the fetch until the last frame is on screen.
const POLL_PRIORITY = 2;

// A PixelReader on the scene's canvas, polled every frame.
export default function usePixelReader() {
  const gl = useThree((state) => state.gl);
  const [reader] = useState(
    () => new PixelReader(gl.getContext() as WebGL2RenderingContext),
  );
  useEffect(() => () => reader.dispose(), [reader]);
  useFrame(() => reader.poll(), POLL_PRIORITY);
  return reader;
}
