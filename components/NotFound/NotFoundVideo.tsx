'use client';

import { useEffect, useRef, useState } from 'react';
import { FaPause, FaPlay } from 'react-icons/fa';

import { headMood } from '@/components/Background/headMood';
import EdgeCard from '@/components/EdgeCard';
import MediaMelt, { melt } from '@/components/MediaMelt';

// How much of the video file's width its picture fills: it is about 4:3
// inside a 16:9 frame, black at either side (measured at 0.7375), less a
// little so no edge of the black shows.
const PICTURE_WIDTH = 0.72;

// The 404 page's card (app/(root)/not-found.tsx): its video on a card like
// the contact form's, as wide and placed the same, sliding in from the
// window's left edge as what is on it fades in. The video's window is 16:9
// (no taller than the space between the header's and footer's fades
// leaves it), and the picture fills it, cropped top and bottom, so the
// file's black sides never show. Clicking it, or the play button over its
// bottom, plays or pauses it. Its window is a tile of one (.collage, as a
// post's images are), so it melts in from the window's right side and out
// again as the site leaves, and rests still; while it plays the scene behind
// the card blurs, as it does while a contact field has focus (data-focus-blur,
// Background/focusBlur.ts). While the page shows, the 3D head looks worried
// (headMood).
export default function NotFoundVideo() {
  const boxRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    headMood.worried = true;
    const box = boxRef.current;
    if (box) {
      box.toggleAttribute('data-shown', true);
      melt(box, 1);
    }
    return () => {
      headMood.worried = false;
    };
  }, []);

  const toggle = () => {
    const video = videoRef.current;
    if (!video) return;
    if (isPlaying) video.pause();
    else void video.play();
    setIsPlaying(!isPlaying);
  };

  return (
    <div className="relative flex size-full justify-end">
      <MediaMelt />
      <EdgeCard className="relative z-20 motion-safe:animate-card-in">
        <article className="flex flex-col gap-4 motion-safe:animate-content-in md:gap-6">
          <h3>404 - Page not found</h3>
          {/* 16:9, as wide as the card, or narrower where the space between
              the header's and footer's fades (less the title) is the
              limit, so it stays 16:9 rather than being cut shorter. */}
          <div
            ref={boxRef}
            className="collage relative aspect-video w-[min(100%,calc((100dvh_-_var(--page-top)_-_var(--page-bottom)_-_10rem)*16/9))]"
          >
            <div className="collage-tile absolute inset-0 overflow-hidden rounded-2xl bg-head-dark [container-type:size]">
              {/* As wide as its picture needs to fill the window across
                (PICTURE_WIDTH), or as its height needs to fill it down,
                whichever is more, centred. */}
              <video
                ref={videoRef}
                data-focus-blur
                data-playing={isPlaying || undefined}
                onClick={toggle}
                style={{
                  width: `max(${100 / PICTURE_WIDTH}cqw, ${(100 * 16) / 9}cqh)`,
                }}
                className="absolute left-1/2 top-1/2 h-auto max-w-none -translate-x-1/2 -translate-y-1/2 cursor-pointer"
                loop
                playsInline
                preload="auto"
              >
                <source src="/not-found/hello-is-it-me.mp4" type="video/mp4" />
              </video>
              <button
                type="button"
                aria-label={isPlaying ? 'Pause the video' : 'Play the video'}
                onClick={toggle}
                className="absolute bottom-4 left-4 rounded-full bg-head-dark/60 p-3 text-head-light backdrop-blur-sm"
              >
                {isPlaying ? <FaPause size={20} /> : <FaPlay size={20} />}
              </button>
            </div>
          </div>
        </article>
      </EdgeCard>
    </div>
  );
}
