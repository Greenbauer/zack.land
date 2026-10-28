import type { Tile } from './collageLayout';

// Where a post's video tile goes while it plays (PostCollage.tsx): as large
// as its 16:9 fits a box `width` by `height` (the post), across its whole
// width unless that would be too tall, centred and untilted.
export function videoFill(width: number, height: number): Tile {
  const across = Math.min(width, (height * 16) / 9);
  const down = (across * 9) / 16;
  return {
    x: (width - across) / 2,
    y: (height - down) / 2,
    width: across,
    height: down,
    tilt: 0,
  };
}
