'use client';

import Image from 'next/image';
import { useEffect, useRef } from 'react';
import YouTube, { YouTubePlayer } from 'react-youtube';

import { MediaSource } from '@/types';

// One image or video, filling its box (an image is cropped to cover it). A
// video tells `onPlaying` when it starts and stops, and pauses while `paused`
// (its post has left the window).
export default function Media({
  mediaSource,
  onPlaying,
  paused = false,
}: {
  mediaSource: MediaSource;
  onPlaying?: (_isPlaying: boolean) => void;
  paused?: boolean;
}) {
  const { key, alt, type, width = 800, height = 800 } = mediaSource;
  const player = useRef<YouTubePlayer | null>(null);

  useEffect(() => {
    if (paused) player.current?.pauseVideo();
  }, [paused]);

  switch (type) {
    case 'YouTube':
      return (
        <YouTube
          videoId={key}
          className="size-full"
          iframeClassName="size-full"
          onReady={({ target }) => {
            player.current = target;
          }}
          onPlay={() => onPlaying?.(true)}
          onPause={() => onPlaying?.(false)}
          onEnd={() => onPlaying?.(false)}
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
