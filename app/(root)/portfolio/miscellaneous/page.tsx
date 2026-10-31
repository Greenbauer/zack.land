import { Metadata } from 'next';

import MediaMelt from '@/components/MediaMelt';
import ScrollArrows from '@/components/PageScroller/ScrollArrows';
import SnapPager from '@/components/PageScroller/SnapPager';
import Post from '@/components/Post';

import Contents from './Contents';

export const metadata: Metadata = {
  title: 'Miscellaneous - Zack Greenbauer',
  description: "Zack Greenbauer's Portfolio and Sandbox",
};

export default function Miscellaneous() {
  return (
    <div className="flex w-full">
      <ScrollArrows />
      <div className="flex min-w-0 flex-1 flex-col gap-[var(--post-gap)]">
        <SnapPager />
        <MediaMelt />
        {Contents.map((content) => (
          <Post key={content.name} content={content} />
        ))}
      </div>
    </div>
  );
}
