'use client';

import { cva } from 'class-variance-authority';
import Image from 'next/image';
import YouTube from 'react-youtube';

import { MediaSource } from '@/types';

const mediaWidthStyle = cva('', {
  variants: {
    width: {
      full: 'w-full',
      '1/2': 'w-1/2',
    },
  },
  defaultVariants: {
    width: 'full',
  },
});

type MediaRendererProps = { mediaSource: MediaSource };

const MediaRenderer = ({ mediaSource }: MediaRendererProps) => {
  const { key, alt, type } = mediaSource;

  switch (type) {
    case 'YouTube':
      return <YouTube videoId={key} className="youtube" />;
    default:
      return <Image src={key} alt={alt} width={800} height={800} priority />;
  }
};

type MediaProps = { mediaSources: MediaSource[] };

export default function Media({ mediaSources }: MediaProps) {
  const isSourcesTotalOdd = mediaSources.length % 2 !== 0;

  return (
    <>
      {mediaSources.map((mediaSource, index) => {
        const { key } = mediaSource;

        const isIndexOdd = index % 3 === 0;

        return (
          <div
            key={key}
            className={mediaWidthStyle({
              width: isSourcesTotalOdd && isIndexOdd ? 'full' : '1/2',
            })}
          >
            <MediaRenderer mediaSource={mediaSource} />
          </div>
        );
      })}
    </>
  );
}
