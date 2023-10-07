import { Menu } from '@headlessui/react';
import { cva } from 'class-variance-authority';

import { Route } from '..';
import NavLink from '../NavLink';
import NavListBackground from '../NavListBackground';
import MobileNavButton from './MobileNavButton';

const mobileNavBackgroundStyle = cva(
  'left-0 top-0 h-full w-screen bg-black pt-20',
  {
    variants: {
      isOpen: {
        true: 'fixed',
        false: 'hidden',
      },
    },
    defaultVariants: {
      isOpen: false,
    },
  },
);

type MobileNavProps = {
  pathname: string;
  backgroundOffsetLeft: number;
  routes: Route[];
};

export default function MobileNav({
  pathname,
  backgroundOffsetLeft,
  routes,
}: MobileNavProps) {
  return (
    <Menu className="flex md:hidden">
      {({ open: isOpen }: { open: boolean }) => (
        <div className="flex items-center">
          <Menu.Button as={MobileNavButton} isActive={isOpen} />
          <div className={mobileNavBackgroundStyle({ isOpen })}>
            <Menu.Items className="relative flex w-auto flex-col focus:outline-none">
              {routes.map(({ label, path }, index) => {
                const isFirst = index === 0;
                const isActive = pathname === path;

                const showLink = !!label;

                if (!showLink) return null;

                return (
                  <Menu.Item key={label} className="flex flex-nowrap">
                    <NavLink
                      path={path}
                      isActive={isActive}
                      isFirst={isFirst}
                      label={label}
                    />
                  </Menu.Item>
                );
              })}
              <NavListBackground offsetLeft={backgroundOffsetLeft} />
            </Menu.Items>
          </div>
        </div>
      )}
    </Menu>
  );
}
