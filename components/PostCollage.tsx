'use client';

import { CSSProperties, useEffect, useRef, useState } from 'react';

import { MediaSource } from '@/types';

import { collage, cropFor, Tile } from './collageLayout';
import Media from './Media';
import { melt } from './MediaMelt';
import { videoFill } from './videoFill';

// A post's images as a block of tiles above its card, touching along their
// edges (laid out by collageLayout.ts). When the post is the one in view
// (`isShown`, as its card arrives) each tile melts in from off the window's
// right side after its own random wait (MediaMelt.tsx), and rests there; when
// the post leaves, each melts back off to the right. Where it can't melt it
// slides (.collage in styles/globals.css). While a video plays it takes the whole post, as More
// does for the card: it grows to the post's full width (videoFill) and its
// card fades away until it stops; the other tiles blur, and the scene
// behind blurs as it does behind a focused contact field (data-focus-blur,
// Background/focusBlur.ts). A press outside it pauses it, which puts it
// back, and so does the post leaving.

const CORNER = '1rem';

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
  const [isPlaying, setIsPlaying] = useState(false);
  // Whether a press outside the playing video has stopped it; cleared as it
  // plays again.
  const [isDismissed, setIsDismissed] = useState(false);
  // Where the video goes while it plays, in the box's own pixels: the
  // post's whole width (or as wide as its height allows), centred in it.
  const [playingAt, setPlayingAt] = useState<Tile | null>(null);

  useEffect(() => {
    const box = boxRef.current;
    const post = box?.closest('[data-post]');
    if (!isPlaying || !box || !post) return;
    const place = () => {
      const at = box.getBoundingClientRect();
      const whole = post.getBoundingClientRect();
      const fill = videoFill(whole.width, whole.height);
      setPlayingAt({
        ...fill,
        x: fill.x + whole.left - at.left,
        y: fill.y + whole.top - at.top,
      });
    };
    place();
    addEventListener('resize', place);
    // A press anywhere but on the video (a press on it reaches its player,
    // not this page) stops it and puts it back.
    const dismiss = () => setIsDismissed(true);
    document.addEventListener('pointerdown', dismiss, true);
    // The card fades away, glass and all, and back when the video stops.
    const fade = post.querySelector('section')?.animate([{ opacity: 0 }], {
      duration: 400,
      easing: 'ease-out',
      fill: 'forwards',
    });
    return () => {
      removeEventListener('resize', place);
      document.removeEventListener('pointerdown', dismiss, true);
      if (!fade) return;
      fade.reverse();
      fade.finished.then(
        () => fade.cancel(),
        () => {},
      );
    };
  }, [isPlaying]);

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
  // time in view brings them in too. Each time the post comes into view or
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
    melt(box, isShown ? 1 : -1);
  }, [isLaidOut, isShown]);

  const { sources, tiles } = layOut(mediaSources, size.width, size.height);

  return (
    <div
      ref={boxRef}
      data-playing={isPlaying || undefined}
      className={`collage relative ${className}`}
      style={style}
    >
      {tiles.map((laidOut, k) => {
        const isVideo = sources[k]!.type === 'YouTube';
        const tile = isVideo && isPlaying && playingAt ? playingAt : laidOut;
        return (
          <div
            key={sources[k]!.key}
            data-video={isVideo || undefined}
            data-focus-blur={isVideo || undefined}
            data-playing={(isVideo && isPlaying) || undefined}
            className="collage-tile absolute overflow-hidden"
            style={{
              left: tile.x,
              top: tile.y,
              width: tile.width,
              height: tile.height,
              borderRadius: tile.round
                .map((isRound) => (isRound ? CORNER : '0'))
                .join(' '),
            }}
          >
            <Media
              mediaSource={sources[k]!}
              onPlaying={
                isVideo
                  ? (playing) => {
                      setIsPlaying(playing);
                      if (playing) setIsDismissed(false);
                    }
                  : undefined
              }
              onPress={() => setIsDismissed(false)}
              paused={!isShown || isDismissed}
            />
          </div>
        );
      })}
    </div>
  );
}

// A post's media in their order and their tiles in a box `width` by
// `height`: a YouTube video goes first, laid out as the main, largest tile;
// with none, an image marked `main` does. (Post.tsx asks it too, to see whether
// a phone's card can show whole: usePhoneWhole.ts.)
export function layOut(
  mediaSources: readonly MediaSource[],
  width: number,
  height: number,
) {
  const sources = [...mediaSources].sort((a, b) => leads(b) - leads(a));
  const tiles = collage(
    sources.map(cropFor),
    width,
    height,
    sources[0] && leads(sources[0]) ? 0 : undefined,
  );
  return { sources, tiles };
}

// How strongly a source claims the main tile: a video most, then an image
// marked `main`.
const leads = (source: MediaSource) =>
  source.type === 'YouTube' ? 2 : source.main ? 1 : 0;
