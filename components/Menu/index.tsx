'use client';

import { cva } from 'class-variance-authority';
import Link from 'next/link';
import { ReactNode, useRef } from 'react';

import useSkyColours from '@/components/SkyText/useSkyColours';

import Arrow from './Arrow';

const linkStyle = cva(
  'group block cursor-pointer border-t border-[color:var(--sky-faint)] px-1 py-3 md:border-none md:py-1 lg:py-3',
  {
    variants: {
      isLast: {
        true: 'border-b',
      },
    },
  },
);

export type MenuItem = {
  name: string;
  path: string;
};

type MenuProps = {
  items: MenuItem[];
  useArrow?: boolean;
};

// A menu item's words, coloured from what is right behind them (the head or
// the sky; the menu runs over both), in the accent on hover.
function SkyLabel({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLSpanElement | null>(null);
  useSkyColours(ref);
  return (
    <span
      ref={ref}
      className="text-[color:var(--sky-text)] group-hover:text-[color:var(--sky-accent)]"
    >
      {children}
    </span>
  );
}

export default function Menu({ items = [], useArrow = false }: MenuProps) {
  // Its line and arrows take their colours from the sky behind the menu.
  const ref = useRef<HTMLDivElement | null>(null);
  useSkyColours(ref);

  return (
    <div
      ref={ref}
      className="sticky top-[var(--page-top)] w-full self-start md:w-auto"
    >
      <div className="left-0 flex border-[color:var(--sky-faint)] py-3 md:border-r">
        <ul className="flex w-full flex-col md:mr-6 md:w-auto md:gap-3 xl:mr-9 xl:gap-6">
          {items.map((item, index) => {
            const { name, path } = item;
            const isLast = index === items.length - 1;

            return (
              <li key={name} className="break-words text-center md:text-right">
                <h3>
                  <Link href={path} className={linkStyle({ isLast })}>
                    <SkyLabel>{name}</SkyLabel>
                  </Link>
                </h3>
              </li>
            );
          })}
        </ul>
        {useArrow && <Arrow />}
      </div>
    </div>
  );
}
