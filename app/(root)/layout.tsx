import { ReactNode } from 'react';

import Background from '@/components/Background';

import Footer from '../../components/Footer';
import Header from '../../components/Header';
import PageScroller from '../../components/PageScroller';

type LayoutProps = {
  children: ReactNode;
};

export default function Layout({ children }: LayoutProps) {
  return (
    <>
      <Background />
      <Header />
      <PageScroller>
        <div className="container mx-3 flex flex-col">
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
        <div className="container mx-3">
          <Footer />
        </div>
      </div>
    </>
  );
}
