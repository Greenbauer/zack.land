import type { Tile } from './collageLayout';

// Where a post's video tile goes while it plays (PostCollage.tsx): across
// the whole width of a box `width` by `height` (the post), 16:9 tall, or the
// box's whole height where that is less (the player then shows the video
// within it), centred down it and untilted.
export function videoFill(width: number, height: number): Tile {
  const down = Math.min(height, (width * 9) / 16);
  return {
    x: 0,
    y: (height - down) / 2,
    width,
    height: down,
    tilt: 0,
  };
}
