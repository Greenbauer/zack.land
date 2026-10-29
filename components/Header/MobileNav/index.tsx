import { Menu } from '@headlessui/react';
import { cva } from 'class-variance-authority';
import { useState } from 'react';

import { Route } from '..';
import NavLink, { isRouteActive, linkStyle, ON_GLASS } from '../NavLink';
import MobileNavButton from './MobileNavButton';

// The open menu is a pane of the cards' frosted glass (data-glass, drawn in
// the 3D scene by components/Background/glass.ts) over the whole screen,
// tinted deeper than a card (data-glass-deep) so its lenses show plainly. The
// glass rounds and feathers a pane's corners (at least 120px), so the pane
// reaches 15rem past every edge of the screen, its padding putting the links
// back where they were: its corners fall off screen and the menu stays square.
// It slides down from above as it opens, fading in on the way
// (animate-menu-in). Its links take the card's ink (ON_GLASS). Portfolio is a
// button: it turns the menu to a second view of its pages, with a way back
// (MenuViews). The page behind it hides while it is open (.mobile-menu there).
const mobileNavBackgroundStyle = cva(
  'mobile-menu -left-60 -top-60 h-[calc(100%+30rem)] w-[calc(100vw+30rem)] p-60 pt-80',
  {
    variants: {
      isOpen: {
        true: 'fixed motion-safe:animate-menu-in',
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
              data-glass-deep
              className={`${mobileNavBackgroundStyle({ isOpen })} ${ON_GLASS}`}
            >
              <Menu.Items className="relative flex w-auto flex-col focus:outline-none">
                <MenuViews pathname={pathname} routes={routes} />
              </Menu.Items>
            </div>
          </div>
        )}
      </Menu>
    </div>
  );
}

// The menu's links, or one route's pages (Portfolio's) after its button is
// tapped. Mounted only while the menu is open, so it opens on the links.
function MenuViews({ pathname, routes }: MobileNavProps) {
  const [opened, setOpened] = useState<Route | null>(null);

  if (opened) {
    return (
      <>
        <button
          type="button"
          onClick={() => setOpened(null)}
          className="group flex w-full text-center outline-none"
        >
          <h5 className={linkStyle({ isFirst: true })}>
            <span aria-hidden className="mr-3">
              ‹
            </span>
            {opened.label}
          </h5>
        </button>
        {opened.children!.map(({ label, path }) => (
          <Menu.Item key={path}>
            {({ close }) => (
              <div className="flex flex-nowrap">
                <NavLink
                  isSub
                  path={path}
                  isActive={pathname === path}
                  label={label}
                  onClick={close}
                />
              </div>
            )}
          </Menu.Item>
        ))}
      </>
    );
  }

  return routes
    .filter(({ label }) => label)
    .map((route, index) => {
      const { label, path, children = [] } = route;
      const isFirst = index === 0;
      if (children.length)
        return (
          <button
            key={path}
            type="button"
            onClick={() => setOpened(route)}
            className="group flex w-full text-center outline-none"
          >
            <h5
              className={linkStyle({
                isActive: isRouteActive(path, pathname),
                isFirst,
              })}
            >
              {label}
            </h5>
          </button>
        );
      return (
        <Menu.Item key={path}>
          {({ close }) => (
            <div className="flex flex-nowrap">
              <NavLink
                path={path}
                isActive={pathname === path}
                isFirst={isFirst}
                label={label!}
                onClick={close}
              />
            </div>
          )}
        </Menu.Item>
      );
    });
}
