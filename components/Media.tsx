'use client';

import Image from 'next/image';
import YouTube from 'react-youtube';

import { MediaSource } from '@/types';

// One image or video, filling its box (an image is cropped to cover it).
export default function Media({ mediaSource }: { mediaSource: MediaSource }) {
  const { key, alt, type, width = 800, height = 800 } = mediaSource;

  switch (type) {
    case 'YouTube':
      return (
        <YouTube
          videoId={key}
          className="size-full"
          iframeClassName="size-full"
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
