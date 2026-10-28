'use client';

import { useEffect, useRef, useState } from 'react';
import { FaPause, FaPlay } from 'react-icons/fa';

import { headMood } from '@/components/Background/headMood';
import EdgeCard from '@/components/EdgeCard';

// The 404 page's card (app/(root)/not-found.tsx): its video on a card like
// the contact form's, as wide and placed the same, sliding in from the
// window's left edge as what is on it fades in. Clicking the video or the
// play button plays or pauses it. While it shows, the 3D head faces the
// camera, worried (headMood).
export default function NotFoundVideo() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    headMood.worried = true;
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
      <EdgeCard className="motion-safe:animate-card-in">
        <article className="flex flex-col gap-4 motion-safe:animate-content-in md:gap-6">
          <div className="flex items-center justify-between gap-3">
            <h3>404 - Page not found</h3>
            <button
              type="button"
              aria-label={isPlaying ? 'Pause the video' : 'Play the video'}
              onClick={toggle}
              className="text-[color:var(--card-ink)]"
            >
              {isPlaying ? <FaPause size={24} /> : <FaPlay size={24} />}
            </button>
          </div>
          {/* As wide as the card, and no taller than the space between the
              header's and footer's fades leaves it. */}
          <video
            ref={videoRef}
            onClick={toggle}
            className="aspect-video max-h-[calc(100dvh-var(--page-top)-var(--page-bottom)-10rem)] w-full cursor-pointer rounded-2xl bg-head-dark object-contain"
            loop
            playsInline
          >
            <source src="/not-found/hello-is-it-me.mp4" type="video/mp4" />
          </video>
        </article>
      </EdgeCard>
    </div>
  );
}
