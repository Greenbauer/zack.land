import { Metadata } from 'next';

import Menu from '@/components/Menu';
import Post from '@/components/Post';

import Contents from './Contents';

export const metadata: Metadata = {
  title: 'Miscellaneous - Zack Greenbauer',
  description: "Zack Greenbauer's Portfolio and Sandbox",
};

export default function Miscellaneous() {
  return (
    <div className="flex w-full justify-between gap-9 xl:gap-12">
      <div className="hidden shrink grow-0 md:flex">
        <Menu items={Contents.map((content) => ({ name: content.name }))} />
      </div>
      <div className="flex shrink grow-0 flex-col gap-3 md:gap-6 xl:gap-12">
        {Contents.map((content) => (
          <Post key={content.name} content={content} />
        ))}
      </div>
    </div>
  );
}
