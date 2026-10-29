import { ReactNode } from 'react';

import Background from '@/components/Background';

import Footer from '../../components/Footer';
import Header from '../../components/Header';
import MediaBend from '../../components/MediaBend';
import PageLeave from '../../components/PageLeave';
import PageScroller from '../../components/PageScroller';

type LayoutProps = {
  children: ReactNode;
};

export default function Layout({ children }: LayoutProps) {
  return (
    <>
      <Background />
      <Header />
      <PageLeave />
      <MediaBend />
      <PageScroller>
        {/* The content's frame: at most the container's width (1536px),
            centred, however wide the window. The 3D head keeps to it too
            (data-frame, components/Background/headPlace.ts). */}
        <div data-frame className="container mx-3 flex flex-col">
          <main className="flex flex-1">
            <div className="relative flex flex-1 pt-[var(--page-top)]">
              {children}
            </div>
          </main>
        </div>
      </PageScroller>
      <div
        data-site-chrome
        className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center"
      >
        {/* On a phone the header and footer keep the cards' text margin (2rem,
            the frame's 0.75rem and a card's 1.25rem padding). */}
        <div className="container mx-3 max-md:mx-8">
          <Footer />
        </div>
      </div>
    </>
  );
}
