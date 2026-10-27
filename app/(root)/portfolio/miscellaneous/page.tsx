import { Metadata } from 'next';

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
    <div className="flex w-full justify-between gap-9 xl:gap-12">
      <div className="hidden shrink-0 md:flex">
        <ScrollArrows />
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-[var(--post-gap)]">
        <SnapPager />
        {Contents.map((content) => (
          <Post key={content.name} content={content} />
        ))}
      </div>
    </div>
  );
}
