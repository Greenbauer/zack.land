'use client';

import { useEffect, useRef, useState } from 'react';
import { FaPause, FaPlay, FaRedo } from 'react-icons/fa';

import { whenPageIn } from '@/components/Background/sceneReady';
import { posterOf } from '@/components/videoPoster';

const SRC = '/work-with-me/offer.mp4';

// What the video shows, for anyone who can't watch it: it has no sound, and
// every word in it is on screen.
const STORY =
  "A 40-second video with no sound. You write it down on the job, then someone types it all again: into the quote, the calendar and the invoice, three times. Every day, over and over. I build AI tools that do that typing for you. Send your notes, or just talk it through, and a draft quote comes back. Forms and emails get entered once. Anything unclear waits for you, and nothing goes out without your OK. Typed once. Tell me what your team does over and over, and I'll build you a free draft. The app screens show sample data.";

type State = 'waiting' | 'playing' | 'paused' | 'ended';

// The offer told in 40 silent seconds (docs/features/work-with-me.md): it
// plays once, muted, as the page opens (once the dark screen over a first
// visit has gone: whenPageIn), and its button pauses, plays or replays it.
// With reduced motion it waits for the button, showing its last frame (its
// poster), which says the offer in two lines. Sized as the 404 page's video
// is (components/NotFound/NotFoundVideo.tsx): as wide as the card, or
// narrower where the window's height is the limit. Only the headline is above
// it, so the whole of it shows clear of the footer's fade on a laptop.
export default function OfferVideo() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [state, setState] = useState<State>('waiting');

  useEffect(() => {
    const video = videoRef.current;
    if (!video || matchMedia('(prefers-reduced-motion: reduce)').matches)
      return;
    return whenPageIn(() => void video.play().catch(() => {}));
  }, []);

  const press = () => {
    const video = videoRef.current;
    if (!video) return;
    if (state === 'playing') return video.pause();
    if (state === 'ended') video.currentTime = 0;
    void video.play().catch(() => {});
  };

  const label =
    state === 'playing'
      ? 'Pause the video'
      : state === 'ended'
        ? 'Play the video again'
        : 'Play the video';
  const Icon =
    state === 'playing' ? FaPause : state === 'ended' ? FaRedo : FaPlay;

  return (
    <figure className="relative m-0 aspect-video w-[min(100%,calc((100dvh_-_var(--page-top)_-_var(--page-bottom)_-_10rem)*16/9))] overflow-hidden rounded-2xl bg-head-dark">
      <video
        ref={videoRef}
        className="size-full"
        src={SRC}
        poster={posterOf(SRC)}
        muted
        playsInline
        preload="auto"
        aria-describedby="offer-video-story"
        onPlay={() => setState('playing')}
        onPause={(e) => !e.currentTarget.ended && setState('paused')}
        onEnded={() => setState('ended')}
      />
      <button
        type="button"
        aria-label={label}
        onClick={press}
        className="absolute bottom-3 left-3 rounded-full bg-head-dark/60 p-3 text-head-light backdrop-blur-sm"
      >
        <Icon size={18} />
      </button>
      <figcaption id="offer-video-story" className="sr-only">
        {STORY}
      </figcaption>
    </figure>
  );
}
