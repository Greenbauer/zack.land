import { ReactElement } from 'react';

import Background from '@/components/Background';

import Footer from '../../components/Footer';
import Header from '../../components/Header';

type LayoutProps = {
  children: ReactElement;
};

export default function Layout({ children }: LayoutProps) {
  return (
    <>
      <Background />
      <Header />
      <div className="container z-0 mx-3 flex flex-col">
        <main className="flex flex-1">
          <div className="relative flex flex-1 pb-6 pt-24 md:pb-12">
            {children}
          </div>
        </main>
        <Footer />
      </div>
    </>
  );
}
