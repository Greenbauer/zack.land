'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { HiPlay } from 'react-icons/hi2';
import YouTube, { YouTubePlayer } from 'react-youtube';

import { MediaSource } from '@/types';

type MediaProps = {
  mediaSource: MediaSource;
  onPlaying?: (_isPlaying: boolean) => void;
  // Its play button was pressed, which lifts whatever stopped it (`paused`).
  onPress?: () => void;
  paused?: boolean;
};

// One image or video, filling its box (cropped to cover it): a silent loop, or
// a YouTube video, which tells `onPlaying` when it starts and stops, and
// pauses while `paused` (its post has left the window).
export default function Media({
  mediaSource,
  onPlaying,
  onPress,
  paused,
}: MediaProps) {
  const { key, alt, type, width = 800, height = 800 } = mediaSource;

  switch (type) {
    case 'YouTube':
      return (
        <YouTubeVideo
          mediaSource={mediaSource}
          onPlaying={onPlaying}
          onPress={onPress}
          paused={paused}
        />
      );
    case 'video':
      return (
        <video
          src={key}
          aria-label={alt}
          width={width}
          height={height}
          className="size-full object-cover"
          autoPlay
          loop
          muted
          playsInline
        />
      );
    default:
      return (
        <Image
          src={key}
          alt={alt}
          width={width}
          height={height}
          className="size-full object-cover"
          preload
        />
      );
  }
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
}: MediaProps) {
  const { key, alt } = mediaSource;
  const player = useRef<YouTubePlayer | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  // Read as the player readies and starts, which can come after its post has
  // left the window.
  const isPaused = useRef(paused);

  useEffect(() => {
    isPaused.current = paused;
    if (paused) player.current?.pauseVideo();
  }, [paused]);

  const stopped = () => {
    setIsStarting(false);
    onPlaying?.(false);
  };
  // A pause can be a moment of a seek: only one that lasts stops it.
  const pauseTimer = useRef(0);

  return (
    <>
      <Image
        src={`https://i.ytimg.com/vi/${key}/hqdefault.jpg`}
        alt={alt}
        {...THUMBNAIL}
        className="size-full object-cover"
        preload
      />
      {!isStarting && (
        <button
          type="button"
          aria-label={`Play ${alt}`}
          className="absolute inset-0 grid place-items-center"
          onClick={() => {
            onPress?.();
            setIsStarting(true);
            setIsLoaded(true);
            player.current?.playVideo();
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
            else target.playVideo();
          }}
          onPlay={({ target }) => {
            clearTimeout(pauseTimer.current);
            if (isPaused.current) return target.pauseVideo();
            setIsStarting(true);
            onPlaying?.(true);
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
