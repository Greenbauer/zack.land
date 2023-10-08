'use client';

import { cva } from 'class-variance-authority';
import Link from 'next/link';
import { Link as RSLink } from 'react-scroll';

import { setMenuId } from '@/utils/menu';

import Arrow from './Arrow';

const linkStyle = cva(
  'block cursor-pointer border-t border-gray-dark px-1 py-3 text-white md:border-none md:py-1 lg:py-3',
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
  path?: string;
};

type MenuProps = {
  items: MenuItem[];
  useArrow?: boolean;
};

export default function Menu({ items = [], useArrow = false }: MenuProps) {
  return (
    <div className="sticky top-36 w-full self-start md:w-auto">
      <div className="left-0 flex border-gray-dark py-3 md:border-r">
        <ul className="flex w-full flex-col md:mr-6 md:w-auto md:gap-3 xl:mr-9 xl:gap-6">
          {items.map((item, index) => {
            const { name, path } = item;
            const isLast = index === items.length - 1;

            return (
              <li key={name} className="break-words text-center md:text-right">
                <h3 className="hover:text-pink">
                  {!!path ? (
                    <Link href={path} className={linkStyle({ isLast })}>
                      {name}
                    </Link>
                  ) : (
                    <RSLink
                      className={linkStyle({ isLast })}
                      activeClass="text-yellow"
                      to={setMenuId(name)}
                      delay={0}
                      offset={-100}
                      spy
                      hashSpy
                    >
                      {name}
                    </RSLink>
                  )}
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
