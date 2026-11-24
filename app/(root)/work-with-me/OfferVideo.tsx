'use client';

import { useEffect, useRef, useState } from 'react';
import { FaPause, FaPlay, FaRedo } from 'react-icons/fa';

import { whenPageIn } from '@/components/Background/sceneReady';
import { melt } from '@/components/MediaMelt';
import { posterOf } from '@/components/videoPoster';
import { isStill } from '@/components/viewport';

const SRC = '/work-with-me/offer.mp4';

// What the video shows, for anyone who can't watch it: it has no sound, and
// every word in it is on screen.
const STORY =
  "A 40-second video with no sound. You write it down on the job, then someone types it all again: into the quote, the calendar and the invoice, three times. Every day, over and over. I build AI tools that do that typing for you. Send your notes, or just talk it through, and a draft quote comes back. Forms and emails get entered once. Anything unclear waits for you, and nothing goes out without your OK. Typed once. Tell me what your team does over and over, and I'll build you a free draft. The app screens show sample data.";

type State = 'waiting' | 'playing' | 'paused' | 'ended';

// Calls `then` once `box`'s tile has come to rest: its melt has finished
// (data-whole, MediaMelt.tsx), or where it can't melt, its slide in.
function whenArrived(box: HTMLElement, then: () => void) {
  if (document.documentElement.hasAttribute('data-melts')) {
    const watch = new MutationObserver(() => {
      if (!box.hasAttribute('data-whole')) return;
      watch.disconnect();
      then();
    });
    watch.observe(box, { attributeFilter: ['data-whole'] });
    return () => watch.disconnect();
  }
  const slid = (event: TransitionEvent) => {
    if (event.propertyName !== 'transform') return;
    box.removeEventListener('transitionend', slid);
    then();
  };
  box.addEventListener('transitionend', slid);
  return () => box.removeEventListener('transitionend', slid);
}

// The offer told in 40 silent seconds (docs/features/work-with-me.md). Its
// window is a tile of one (.collage), as the 404 page's video and a post's
// pictures are, so it melts in from the window's right side as the page
// opens and out again as the site leaves (MediaMelt.tsx; it slides where it
// can't melt, and fades with reduced motion: styles/globals.css). Once it
// has come to rest (and the dark screen over a first visit has gone:
// whenPageIn) it plays once, muted, and its button pauses, plays or replays
// it. With reduced motion it waits for the button, showing its last frame
// (its poster), which says the offer in two lines. Sized as the 404 page's video
// is (components/NotFound/NotFoundVideo.tsx): as wide as the card, or
// narrower where the window's height is the limit, but never under 20rem (a
// phone on its side has no height to spare). Only the headline is above
// it, so the whole of it shows clear of the footer's fade on a laptop.
// The button sits bottom right, the one corner the video's words never reach.
export default function OfferVideo() {
  const boxRef = useRef<HTMLElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [state, setState] = useState<State>('waiting');

  useEffect(() => {
    const box = boxRef.current;
    const video = videoRef.current;
    if (!box || !video) return;
    box.toggleAttribute('data-shown', true);
    melt(box, 1);
    if (isStill()) return;
    let stopWaiting = () => {};
    const stopArriving = whenArrived(box, () => {
      stopWaiting = whenPageIn(() => void video.play().catch(() => {}));
    });
    return () => {
      stopArriving();
      stopWaiting();
    };
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
    <figure
      ref={boxRef}
      className="collage relative m-0 aspect-video w-[min(100%,max(20rem,calc((100dvh_-_var(--page-top)_-_var(--page-bottom)_-_10rem)*16/9)))]"
    >
      <div className="collage-tile absolute inset-0 overflow-hidden rounded-2xl bg-head-dark">
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
          className="absolute bottom-2 right-2 rounded-full bg-head-dark/60 p-2 text-head-light backdrop-blur-sm md:bottom-3 md:right-3 md:p-3"
        >
          <Icon className="size-4 md:size-[18px]" />
        </button>
      </div>
      <figcaption id="offer-video-story" className="sr-only">
        {STORY}
      </figcaption>
    </figure>
  );
}
