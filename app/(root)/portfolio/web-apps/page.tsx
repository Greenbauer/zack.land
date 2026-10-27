import { Metadata } from 'next';

import Menu from '@/components/Menu';
import SnapPager from '@/components/PageScroller/SnapPager';
import Post from '@/components/Post';

import Contents from './Contents';

export const metadata: Metadata = {
  title: 'Web Apps - Zack Greenbauer',
  description: "Zack Greenbauer's Portfolio and Sandbox",
};

export default function WebApps() {
  return (
    <div className="flex w-full justify-between gap-9 xl:gap-12">
      <div className="hidden shrink grow-0 md:flex">
        <Menu items={Contents.map((content) => ({ name: content.name }))} />
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
