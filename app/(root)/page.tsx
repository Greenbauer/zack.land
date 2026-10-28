import { Metadata } from 'next';

import Title from '@/components/Home/Title';
import TitleBox from '@/components/Home/TitleBox';

export const metadata: Metadata = {
  title: 'Home - Zack Greenbauer',
  description: "Zack Greenbauer's Portfolio and Sandbox",
};

export default function Page() {
  return (
    // Below lg the head fills the middle of the screen, so the title sits at
    // the top, above it; on a phone it is centred between the header's
    // bottom (80px) and the top of the head (a fifth of the way down: the
    // head scales with the window's height), in TitleBox. From lg it sits
    // beside the head, vertically centred.
    <div className="flex size-full items-start justify-end lg:items-center">
      {/* It slides in from the right, and away to the right before the
          site leaves the page (TitleBox). */}
      <TitleBox>
        <Title />
      </TitleBox>
    </div>
  );
}
