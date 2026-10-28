import { Metadata } from 'next';

import Title from '@/components/Home/Title';

export const metadata: Metadata = {
  title: 'Home - Zack Greenbauer',
  description: "Zack Greenbauer's Portfolio and Sandbox",
};

export default function Page() {
  return (
    // Below lg the head fills the middle of the screen, so the title sits at
    // the top, above it; from lg it sits beside the head, vertically centred.
    <div className="flex size-full items-start justify-end lg:items-center">
      {/* On a wide screen the head centres itself in the space left of the
          title (data-head-avoid, components/Background/headPlace.ts). */}
      <div
        data-head-avoid
        className="flex w-full flex-col text-center md:gap-6 lg:max-w-lg lg:text-left"
      >
        <Title />
      </div>
    </div>
  );
}
