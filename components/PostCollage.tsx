'use client';

import { CSSProperties, useEffect, useRef, useState } from 'react';

import { MediaSource } from '@/types';

import { collage, cropFor } from './collageLayout';
import Media from './Media';

// A post's images as separate tiles above its card (laid out by
// collageLayout.ts). When the post comes into view each tile bounces in from its
// own random side after its own random wait, then drifts gently on its own
// beat; when the post leaves, each falls away the same way. The motion is in
// .collage in styles/globals.css.

export default function PostCollage({
  mediaSources,
  className = '',
  style,
}: {
  mediaSources: MediaSource[];
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

  // Watched once the tiles are there (after the box is measured), so the
  // first time in view bounces them in too.
  const isLaidOut = size.width > 0 && size.height > 0;
  useEffect(() => {
    const box = boxRef.current;
    if (!box || !isLaidOut) return;
    // Each time the post comes into view or leaves, every tile gets a new
    // side to come from (or fall to) and a new wait.
    const view = new IntersectionObserver(
      ([entry]) => {
        const shown = entry!.isIntersecting;
        for (const tile of box.querySelectorAll<HTMLElement>('.collage-tile')) {
          const angle = Math.random() * 2 * Math.PI;
          tile.style.setProperty('--from-x', `${Math.cos(angle) * 90}px`);
          tile.style.setProperty('--from-y', `${Math.sin(angle) * 90}px`);
          tile.style.setProperty(
            '--wait',
            `${Math.random() * (shown ? 0.6 : 0.25)}s`,
          );
        }
        box.toggleAttribute('data-shown', shown);
      },
      // In view: half its tiles' space clear of the page's top and bottom
      // fades, so the next post's tiles, peeking under the footer's fade, wait
      // to bounce in until it is paged to.
      { threshold: 0.5, rootMargin: '-20% 0px -20% 0px' },
    );
    view.observe(box);
    return () => view.disconnect();
  }, [isLaidOut]);

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
          className="collage-tile absolute overflow-hidden rounded-2xl shadow-2xl shadow-head-dark/60"
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
