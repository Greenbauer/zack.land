'use client';

import { usePathname } from 'next/navigation';
import { useRef } from 'react';

import useSkyColours from '@/components/SkyText/useSkyColours';

import DesktopNav from './DesktopNav';
import HeaderTitle from './HeaderTitle';
import MobileNav from './MobileNav';

export type Route = {
  label?: string;
  path: string;
  headerTitle?: string;
  // Pages under it, offered in a dropdown (Portfolio's two).
  children?: { label: string; path: string }[];
};

const routes: Route[] = [
  {
    label: 'Home',
    path: '/',
  },
  {
    label: 'Portfolio',
    path: '/portfolio',
    children: [
      { label: 'Web Apps', path: '/portfolio/web-apps' },
      { label: 'Miscellaneous', path: '/portfolio/miscellaneous' },
    ],
  },
  {
    label: 'Contact',
    path: '/contact',
    headerTitle: 'Contact Me',
  },
  {
    path: '/portfolio/miscellaneous',
    headerTitle: 'Miscellaneous',
  },
  {
    path: '/portfolio/web-apps',
    headerTitle: 'Web Apps',
  },
];

export default function Header() {
  const pathname = usePathname();
  // The links take their colours from the sky behind them; the page title
  // is drawn in 3D like the home page's name (HeaderTitle).
  const linksRef = useRef<HTMLDivElement | null>(null);
  useSkyColours(linksRef);

  const { headerTitle } = routes.find(({ path }) => path === pathname) || {};

  return (
    <div className="pointer-events-none fixed inset-x-0 z-40 flex h-20 w-full items-center justify-center px-3">
      <div className="container flex w-full items-center justify-between gap-3">
        <div ref={linksRef} className="flex">
          <DesktopNav routes={routes} pathname={pathname} />
          <MobileNav routes={routes} pathname={pathname} />
        </div>
        {!!headerTitle && <HeaderTitle title={headerTitle} />}
      </div>
    </div>
  );
}
