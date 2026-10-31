import { Menu } from '@headlessui/react';
import { cva } from 'class-variance-authority';
import { useEffect, useState } from 'react';

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
// (animate-menu-in), its links fading in as it stops (animate-menu-content-in),
// and closing it fades out evenly as it rises a little (animate-menu-out): it
// is far taller than the screen, so a slide away would hold its deep tint over
// the page until a sudden reveal at the end. Its links take the card's ink
// (ON_GLASS). Portfolio is a button: it turns the menu to a second view of its
// pages, with a way back (MenuViews). The page behind it hides while it is
// open (.mobile-menu there). A page chosen from it comes in under it
// (PageLeave.tsx), and it closes once that page is in.
const mobileNavBackgroundStyle = cva(
  'mobile-menu -left-60 -top-60 h-[calc(100%+30rem)] w-[calc(100vw+30rem)] p-60 pt-80',
  {
    variants: {
      state: {
        open: 'fixed motion-safe:animate-menu-in',
        // Not `fixed`, which says the menu is open (focusBlur.ts's menuOpen):
        // the page shows from here.
        closing: 'pointer-events-none animate-menu-out [position:fixed]',
        closed: 'hidden',
      },
    },
    defaultVariants: {
      state: 'closed',
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
        {({ open: isOpen, close }: { open: boolean; close: () => void }) => (
          <div className="flex items-center">
            <Menu.Button as={MobileNavButton} isActive={isOpen} />
            <MenuPane
              isOpen={isOpen}
              close={close}
              pathname={pathname}
              routes={routes}
            />
          </div>
        )}
      </Menu>
    </div>
  );
}

type MenuPaneProps = MobileNavProps & {
  isOpen: boolean;
  close: () => void;
};

// The menu's glass, kept on screen with its links as it fades away.
function MenuPane({ isOpen, close, pathname, routes }: MenuPaneProps) {
  const [wasOpen, setWasOpen] = useState(isOpen);
  const [closing, setClosing] = useState(false);
  if (isOpen !== wasOpen) {
    setWasOpen(isOpen);
    setClosing(
      !isOpen && !matchMedia('(prefers-reduced-motion: reduce)').matches,
    );
  }

  // The page chosen from the menu has come in under it.
  useEffect(close, [pathname, close]);

  const state = isOpen ? 'open' : closing ? 'closing' : 'closed';
  return (
    <div
      data-glass
      data-glass-deep
      className={`${mobileNavBackgroundStyle({ state })} ${ON_GLASS}`}
      onAnimationEnd={({ animationName }) => {
        if (animationName === 'menu-out') setClosing(false);
      }}
    >
      <Menu.Items
        static
        className="relative flex w-auto flex-col focus:outline-none motion-safe:animate-menu-content-in"
      >
        {state !== 'closed' && (
          <MenuViews pathname={pathname} routes={routes} />
        )}
      </Menu.Items>
    </div>
  );
}

// The menu's links, or one route's pages (Portfolio's) after its button is
// tapped. Mounted only while the menu shows, so it opens on the links.
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
