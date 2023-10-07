'use client';

import { cva } from 'class-variance-authority';
import Image from 'next/image';
import YouTube from 'react-youtube';

import { MediaSrc } from '@/types';

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

type MediaRendererProps = { source: MediaSrc };

const MediaRenderer = ({ source }: MediaRendererProps) => {
  const { key, alt, type } = source;

  switch (type) {
    case 'YouTube':
      return (
        <div className="youtube">
          <YouTube videoId={key} />
        </div>
      );
    default:
      return <Image src={key} alt={alt} width={800} height={800} priority />;
  }
};

type MediaProps = { sources: MediaSrc[] };

export default function Media({ sources }: MediaProps) {
  const isSourcesTotalOdd = sources.length % 2 !== 0;

  return (
    <>
      {sources.map((source, index) => {
        const { key } = source;

        const isIndexOdd = index % 3 === 0;

        return (
          <div
            key={key}
            className={mediaWidthStyle({
              width: isSourcesTotalOdd && isIndexOdd ? 'full' : '1/2',
            })}
          >
            <MediaRenderer source={source} />
          </div>
        );
      })}
    </>
  );
}
