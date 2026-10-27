import { Menu } from '@headlessui/react';
import { cva } from 'class-variance-authority';

import { Route } from '..';
import NavLink from '../NavLink';
import useGradientShift from '../useGradientShift';
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
  const listRef = useGradientShift(backgroundOffsetLeft);

  return (
    <div className="pointer-events-auto flex md:hidden">
      <Menu>
        {({ open: isOpen }: { open: boolean }) => (
          <div className="flex items-center">
            <Menu.Button as={MobileNavButton} isActive={isOpen} />
            <div className={mobileNavBackgroundStyle({ isOpen })}>
              <Menu.Items
                ref={listRef}
                className="relative flex w-auto flex-col focus:outline-none"
              >
                {routes.map(({ label, path }, index) => {
                  const isFirst = index === 0;
                  const isActive = pathname === path;

                  const showLink = !!label;

                  if (!showLink) return null;

                  return (
                    <Menu.Item key={label}>
                      {({ close }) => (
                        <div className="flex flex-nowrap">
                          <NavLink
                            path={path}
                            isActive={isActive}
                            isFirst={isFirst}
                            label={label}
                            onClick={close}
                          />
                        </div>
                      )}
                    </Menu.Item>
                  );
                })}
              </Menu.Items>
            </div>
          </div>
        )}
      </Menu>
    </div>
  );
}
