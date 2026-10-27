import { Metadata } from 'next';

import Title from '@/components/Home/Title';

export const metadata: Metadata = {
  title: 'Home - Zack Greenbauer',
  description: "Zack Greenbauer's Portfolio and Sandbox",
};

export default function Page() {
  return (
    <div className="flex size-full items-center justify-end">
      <div className="flex w-full flex-col text-center md:gap-6 lg:max-w-lg lg:text-left">
        <Title />
      </div>
    </div>
  );
}
