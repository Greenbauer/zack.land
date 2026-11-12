'use client';

import { usePathname } from 'next/navigation';
import { useRef } from 'react';

import useSkyColours from '@/components/SkyText/useSkyColours';

import DesktopNav from './DesktopNav';
import HeaderTitle from './HeaderTitle';
import MobileNav from './MobileNav';

export type Route = {
  label: string;
  path: string;
  // Pages under it, offered in a dropdown (Portfolio's two).
  children?: { label: string; path: string }[];
};

const routes: Route[] = [
  { label: 'Home', path: '/' },
  {
    label: 'Portfolio',
    path: '/portfolio',
    children: [
      { label: 'Web Apps', path: '/portfolio/web-apps' },
      { label: 'Miscellaneous', path: '/portfolio/miscellaneous' },
    ],
  },
  { label: 'Contact', path: '/contact' },
];

// The title the header shows on each page that has one.
const TITLES: Record<string, string> = {
  '/contact': 'Contact Me',
  '/portfolio/web-apps': 'Web Apps',
  '/portfolio/miscellaneous': 'Miscellaneous',
};

export default function Header() {
  const pathname = usePathname();
  // The links take their colours from the sky behind them; the page title
  // is drawn in 3D like the home page's name (HeaderTitle).
  const linksRef = useRef<HTMLElement | null>(null);
  useSkyColours(linksRef);

  const headerTitle = TITLES[pathname];

  return (
    <header
      data-site-chrome
      className="pointer-events-none fixed inset-x-0 z-40 flex h-20 w-full items-center justify-center px-3 max-md:px-8"
    >
      <div className="container flex w-full items-center justify-between gap-3">
        <nav ref={linksRef} aria-label="Main" className="flex">
          <DesktopNav routes={routes} pathname={pathname} />
          <MobileNav routes={routes} pathname={pathname} />
        </nav>
        {!!headerTitle && <HeaderTitle title={headerTitle} />}
      </div>
    </header>
  );
}
