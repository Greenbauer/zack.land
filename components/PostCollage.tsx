'use client';

import { CSSProperties, useEffect, useRef, useState } from 'react';

import { MediaSource } from '@/types';

import { collage, cropFor } from './collageLayout';
import Media from './Media';

// A post's images as separate tiles above its card (laid out by
// collageLayout.ts). When the post is the one in view (`isShown`, as its card
// arrives) each tile slides in from off the window's right side after its own
// random wait, then drifts gently on its own beat; when the post leaves, each
// slides back off to the right. The motion is in .collage in
// styles/globals.css.

export default function PostCollage({
  mediaSources,
  isShown,
  className = '',
  style,
}: {
  mediaSources: MediaSource[];
  isShown: boolean;
  className?: string;
  style?: CSSProperties;
}) {
  const boxRef = useRef<HTMLDivElement | null>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const box = boxRef.current;
    if (!box) return;
    const resize = new ResizeObserver(([entry]) => {
      const { width, height } = entry!.contentRect;
      setSize({ width, height });
    });
    resize.observe(box);
    return () => resize.disconnect();
  }, []);

  // Set once the tiles are there (after the box is measured), so the first
  // time in view slides them in too. Each time the post comes into view or
  // leaves, every tile gets a new wait. (It follows the post rather than the
  // tiles' own space, which on a short phone is too small a strip to count
  // as in view.)
  const isLaidOut = size.width > 0 && size.height > 0;
  useEffect(() => {
    const box = boxRef.current;
    if (!box || !isLaidOut) return;
    for (const tile of box.querySelectorAll<HTMLElement>('.collage-tile')) {
      tile.style.setProperty(
        '--wait',
        `${Math.random() * (isShown ? 0.6 : 0.25)}s`,
      );
    }
    box.toggleAttribute('data-shown', isShown);
  }, [isLaidOut, isShown]);

  // A video goes first, laid out as the main, largest tile.
  const sources = [...mediaSources].sort(
    (a, b) => Number(b.type === 'YouTube') - Number(a.type === 'YouTube'),
  );
  const tiles = collage(
    sources.map(cropFor),
    sources.map(({ key }) => key),
    size.width,
    size.height,
    sources[0]?.type === 'YouTube' ? 0 : undefined,
  );

  return (
    <div ref={boxRef} className={`collage relative ${className}`} style={style}>
      {tiles.map((tile, k) => (
        <div
          key={sources[k]!.key}
          className="collage-tile absolute overflow-hidden rounded-2xl"
          style={
            {
              left: tile.x,
              top: tile.y,
              width: tile.width,
              height: tile.height,
              '--tilt': `${tile.tilt}deg`,
              // Its own drift: 5 to 8 seconds a cycle, started part way in.
              '--drift': `${5 + ((k * 7) % 4)}s`,
              '--drift-at': `${-k * 1.3}s`,
            } as CSSProperties
          }
        >
          <Media mediaSource={sources[k]!} />
        </div>
      ))}
    </div>
  );
}
