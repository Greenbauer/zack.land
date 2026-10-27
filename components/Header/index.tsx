'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

import useWindowSize from '@/hooks/useWindowSize';

import DesktopNav from './DesktopNav';
import MobileNav from './MobileNav';

export type Route = { label?: string; path: string; headerTitle?: string };

const routes: Route[] = [
  {
    label: 'Home',
    path: '/',
  },
  {
    label: 'Portfolio',
    path: '/portfolio',
    headerTitle: 'Portfolio',
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
  const navRef = useRef<HTMLDivElement | null>(null);
  const { width } = useWindowSize();

  const [offsetLeft, setOffsetLeft] = useState<number>(0);

  const { headerTitle } = routes.find(({ path }) => path === pathname) || {};

  useEffect(() => {
    setOffsetLeft(navRef.current?.offsetLeft || 0);
  }, [width]);

  return (
    <div className="pointer-events-none fixed inset-x-0 z-40 flex h-20 w-full items-center justify-center px-3">
      <div
        ref={navRef}
        className="container flex w-full items-center justify-between gap-3"
      >
        <DesktopNav
          routes={routes}
          pathname={pathname}
          backgroundOffsetLeft={offsetLeft}
        />
        <MobileNav
          routes={routes}
          pathname={pathname}
          backgroundOffsetLeft={offsetLeft}
        />
        {!!headerTitle && <h4 className="text-right">{headerTitle}</h4>}
      </div>
    </div>
  );
}
