'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { HiPlay } from 'react-icons/hi2';
import YouTube, { YouTubePlayer } from 'react-youtube';

import { whenPageIn } from '@/components/Background/sceneReady';
import useReducedMotion from '@/hooks/useReducedMotion';
import { MediaSource } from '@/types';

import { posterOf } from './videoPoster';

type MediaProps = {
  mediaSource: MediaSource;
  onPlaying?: (_isPlaying: boolean) => void;
  // Its play button was pressed, which lifts whatever stopped it (`paused`).
  onPress?: () => void;
  paused?: boolean;
  // How wide it shows, in CSS pixels, so a phone's screen gets a copy the
  // size of its tile rather than the widest (the picture's `sizes`).
  shownWidth?: number;
  // When a picture loads (PostCollage decides): 'first', at once and ahead
  // of the rest (the post in view as the page opens); 'now', at once; or
  // 'held', not drawn at all yet (a later post, until the page is in).
  load?: Load;
};

type Load = 'first' | 'now' | 'held';

// next/image's loading for each Load. Not lazy for 'held': Safari's engine
// fetched a later post's large tiles under the dark screen all the same.
// Not next/image's `preload` for 'first': its <link> is made with the
// tile's first width, which the footer can still change, and the picture
// was then fetched twice.
const LOADING = {
  first: { loading: 'eager', fetchPriority: 'high' },
  now: { loading: 'eager' },
  held: null,
} as const;

// One image or video, filling its box (cropped to cover it): a silent loop,
// which plays while its post is in view, or a YouTube video, which tells
// `onPlaying` when it starts and stops; either pauses while `paused` (its
// post has left the window).
export default function Media({
  mediaSource,
  onPlaying,
  onPress,
  paused,
  shownWidth,
  load = 'now',
}: MediaProps) {
  const { key, alt, type, width = 800, height = 800 } = mediaSource;
  const loading = LOADING[load];
  const sizes = useSizes(shownWidth);

  switch (type) {
    case 'YouTube':
      return (
        <YouTubeVideo
          mediaSource={mediaSource}
          onPlaying={onPlaying}
          onPress={onPress}
          paused={paused}
          sizes={sizes}
          loading={loading}
        />
      );
    case 'video':
      return <LoopVideo mediaSource={mediaSource} paused={paused} />;
    default:
      return (
        loading && (
          <Image
            src={key}
            alt={alt}
            width={width}
            height={height}
            sizes={sizes}
            className="size-full object-cover"
            {...loading}
          />
        )
      );
  }
}

// The `sizes` for a picture shown `shownWidth` wide: its widest so far. A
// post's first layout can be a passing one (the footer shrinking under a
// phone's arrow), and a `sizes` that shrank after it fetched the picture
// again, smaller.
function useSizes(shownWidth?: number) {
  const [widest, setWidest] = useState(shownWidth ?? 0);
  if (shownWidth && shownWidth > widest) setWidest(shownWidth);
  return widest ? `${Math.max(widest, shownWidth ?? 0)}px` : undefined;
}

// A silent loop. It shows its poster and loads nothing more until it plays:
// once its post is in view and the page is in (data-page-in), so under the
// dark screen it doesn't download alongside the scene's files. Its melt
// draws the poster until it has a frame (MediaMelt.tsx). With reduced motion
// it does not play: its poster stands still in its place.
function LoopVideo({
  mediaSource,
  paused = false,
}: Pick<MediaProps, 'mediaSource' | 'paused'>) {
  const { key, alt, width = 800, height = 800 } = mediaSource;
  const video = useRef<HTMLVideoElement | null>(null);
  const isStill = useReducedMotion();

  useEffect(() => {
    const loop = video.current;
    if (!loop) return;
    if (paused || isStill) {
      loop.pause();
      return;
    }
    // A pause before it starts turns down play()'s promise.
    return whenPageIn(() => void loop.play().catch(() => {}));
  }, [paused, isStill]);

  return (
    <video
      ref={video}
      src={key}
      poster={posterOf(key)}
      aria-label={alt}
      width={width}
      height={height}
      className="size-full object-cover"
      preload="none"
      loop
      muted
      playsInline
    />
  );
}

// YouTube's largest thumbnail every video has is 480 by 360: the video between
// black bars, which its crop to a wide tile leaves out.
const THUMBNAIL = { width: 480, height: 360 };
// How long a pause lasts before it counts as stopping, in milliseconds.
const SEEK_MS = 300;

// A YouTube video's thumbnail and a play button until it is played, and again
// when it stops: the page can draw the thumbnail and see the pointer over it,
// so it bends and melts as any picture does, as an embed cannot. The player
// loads on the first press and stays, hidden, so a later press goes on from
// where it stopped, unless More has since dropped the tile, when it starts
// over. (`isStarting` lets the player show, in case the browser asks for a
// press on the player itself.)
function YouTubeVideo({
  mediaSource,
  onPlaying,
  onPress,
  paused = false,
  sizes,
  loading,
}: Omit<MediaProps, 'load' | 'shownWidth'> & {
  sizes?: string;
  loading: (typeof LOADING)[Load];
}) {
  const { key, alt } = mediaSource;
  const player = useRef<YouTubePlayer | null>(null);
  const playButton = useRef<HTMLButtonElement | null>(null);
  // Whether focus was in the player as it stopped, so it goes back to the
  // play button rather than dropping to the page.
  const refocus = useRef(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  // Read as the player readies and starts, which can come after its post has
  // left the window.
  const isPaused = useRef(paused);

  useEffect(() => {
    isPaused.current = paused;
    if (paused) player.current?.pauseVideo();
  }, [paused]);

  // Whether it has told `onPlaying` it plays. Dropped while playing (its
  // post's tiles go when the box they fill does, as on a window turned too
  // short for them), it says it has stopped, or its post would stay given
  // over to it, its card faded away.
  const playingRef = useRef(false);
  const playing = () => {
    setIsStarting(true);
    playingRef.current = true;
    onPlaying?.(true);
  };
  const stopped = () => {
    const iframe = player.current?.getIframe?.();
    refocus.current = !!iframe && document.activeElement === iframe;
    setIsStarting(false);
    playingRef.current = false;
    onPlaying?.(false);
  };
  useEffect(() => {
    if (isStarting || !refocus.current) return;
    refocus.current = false;
    playButton.current?.focus();
  }, [isStarting]);
  // Pressed, the play button goes: focus moves into the player, which takes
  // the keys from there, not to the page. Once the player shows (it is
  // hidden until it starts, and a hidden frame takes no focus), or once it
  // is ready, on a first press.
  const wantsFocus = useRef(false);
  const focusPlayer = () => {
    const iframe = player.current?.getIframe?.();
    if (!wantsFocus.current || !iframe) return;
    wantsFocus.current = false;
    iframe.focus();
  };
  useEffect(() => {
    if (isStarting) focusPlayer();
  }, [isStarting]);
  // A pause can be a moment of a seek: only one that lasts stops it.
  const pauseTimer = useRef(0);
  const onPlayingRef = useRef(onPlaying);
  useEffect(() => {
    onPlayingRef.current = onPlaying;
  });
  useEffect(
    () => () => {
      clearTimeout(pauseTimer.current);
      if (playingRef.current) onPlayingRef.current?.(false);
    },
    [],
  );

  return (
    <>
      {loading && (
        <Image
          src={`https://i.ytimg.com/vi/${key}/hqdefault.jpg`}
          alt={alt}
          {...THUMBNAIL}
          sizes={sizes}
          className="size-full object-cover"
          {...loading}
        />
      )}
      {!isStarting && (
        <button
          ref={playButton}
          type="button"
          aria-label={`Play ${alt}`}
          className="absolute inset-0 grid place-items-center"
          onClick={() => {
            onPress?.();
            setIsStarting(true);
            setIsLoaded(true);
            player.current?.playVideo();
            wantsFocus.current = true;
          }}
        >
          <span className="rounded-full bg-head-dark/60 p-3 text-head-light backdrop-blur-sm">
            <HiPlay aria-hidden className="size-8" />
          </span>
        </button>
      )}
      {isLoaded && (
        <YouTube
          videoId={key}
          opts={{ playerVars: { autoplay: 1 } }}
          className={`absolute inset-0 ${isStarting ? '' : 'invisible'}`}
          iframeClassName="size-full"
          onReady={({ target }) => {
            player.current = target;
            if (isPaused.current) target.pauseVideo();
            else {
              target.playVideo();
              // Unless the visitor has moved on while it loaded.
              if (document.activeElement === document.body) focusPlayer();
              else wantsFocus.current = false;
            }
          }}
          onPlay={({ target }) => {
            clearTimeout(pauseTimer.current);
            if (isPaused.current) return target.pauseVideo();
            playing();
          }}
          onPause={() => {
            pauseTimer.current = window.setTimeout(stopped, SEEK_MS);
          }}
          onEnd={stopped}
        />
      )}
    </>
  );
}
