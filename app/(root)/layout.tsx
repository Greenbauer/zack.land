import { ReactNode } from 'react';
import { preload } from 'react-dom';

import Background from '@/components/Background';
import { SCENE_FILES } from '@/components/Background/sceneFiles';

import Footer from '../../components/Footer';
import Header from '../../components/Header';
import MediaBend from '../../components/MediaBend';
import PageLeave from '../../components/PageLeave';
import PageScroller from '../../components/PageScroller';

type LayoutProps = {
  children: ReactNode;
};

export default function Layout({ children }: LayoutProps) {
  // Every page waits under the dark screen for the scene's files: ask for
  // them in <head>, so they download alongside the scripts. As three's
  // loaders fetch them (same origin, mode cors), so the fetches reuse them.
  for (const file of SCENE_FILES)
    preload(file, { as: 'fetch', crossOrigin: 'anonymous' });
  return (
    <>
      <Background />
      <Header />
      <PageLeave />
      <MediaBend />
      {/* Blurs what lies under the page while a post's video plays,
          opened over its post (styles/globals.css). */}
      <div
        data-behind-blur
        aria-hidden
        className="pointer-events-none fixed inset-0"
      />
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
