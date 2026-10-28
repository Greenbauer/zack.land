import { Menu } from '@headlessui/react';
import { cva } from 'class-variance-authority';

import { Route } from '..';
import NavLink, { isRouteActive, linkStyle, ON_GLASS } from '../NavLink';
import MobileNavButton from './MobileNavButton';

// The open menu is a pane of the cards' frosted glass (data-glass, drawn in
// the 3D scene by components/Background/glass.ts) over the whole screen. The
// glass rounds and feathers a pane's corners (at least 120px), so the pane
// reaches 15rem past every edge of the screen, its padding putting the links
// back where they were: its corners fall off screen and the menu stays square.
// Its links take the card's ink (ON_GLASS). Portfolio's pages are listed
// under it, smaller, rather than in a dropdown: the menu is already open.
// The page behind it hides while it is open (.mobile-menu there).
const mobileNavBackgroundStyle = cva(
  'mobile-menu -left-60 -top-60 h-[calc(100%+30rem)] w-[calc(100vw+30rem)] p-60 pt-80',
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
  routes: Route[];
};

export default function MobileNav({ pathname, routes }: MobileNavProps) {
  return (
    <div className="pointer-events-auto flex md:hidden">
      <Menu>
        {({ open: isOpen }: { open: boolean }) => (
          <div className="flex items-center">
            <Menu.Button as={MobileNavButton} isActive={isOpen} />
            <div
              data-glass
              className={`${mobileNavBackgroundStyle({ isOpen })} ${ON_GLASS}`}
            >
              <Menu.Items className="relative flex w-auto flex-col focus:outline-none">
                {routes
                  .filter(({ label }) => label)
                  .flatMap(({ label, path, children = [] }) => [
                    {
                      label: label!,
                      path,
                      isSub: false,
                      isLink: !children.length,
                    },
                    ...children.map((child) => ({
                      ...child,
                      isSub: true,
                      isLink: true,
                    })),
                  ])
                  .map(({ label, path, isSub, isLink }, index) => {
                    const isActive = isLink
                      ? pathname === path
                      : isRouteActive(path, pathname);
                    return isLink ? (
                      <Menu.Item key={path}>
                        {({ close }) => (
                          <div className="flex flex-nowrap">
                            <NavLink
                              isSub={isSub}
                              path={path}
                              isActive={isActive}
                              isFirst={index === 0}
                              label={label}
                              onClick={close}
                            />
                          </div>
                        )}
                      </Menu.Item>
                    ) : (
                      <h5
                        key={path}
                        className={`text-center ${linkStyle({
                          isActive,
                          isFirst: index === 0,
                        })}`}
                      >
                        {label}
                      </h5>
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
