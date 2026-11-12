import { Popover, PopoverButton, PopoverPanel } from '@headlessui/react';
import { cva } from 'class-variance-authority';
import { useCallback, useEffect, useRef, useState } from 'react';

import { isStill } from '@/components/viewport';

import { Route } from '..';
import NavLink, { isRouteActive, linkStyle, ON_GLASS } from '../NavLink';
import MobileNavButton from './MobileNavButton';

// The open menu is a pane of the cards' frosted glass (data-glass, drawn in
// the 3D scene by components/Background/glass.ts) over the whole screen,
// tinted deeper than a card (data-glass-deep) so its lenses show plainly. As a
// card's does at the window's edge (EdgeCard.tsx), the pane reaches 15rem
// past every edge of the screen, its padding putting the links back where
// they were, so its rounded corners fall off screen and the menu stays square.
// It slides down from above as it opens, fading in on the way
// (animate-menu-in), and closing it fades out evenly as it rises a little
// (animate-menu-out): it is far taller than the screen, so a slide away would
// hold its deep tint over the page until a sudden reveal at the end. Its links
// take the card's ink (ON_GLASS). Portfolio is a button: it turns the menu to a second view of its
// pages, with a way back (MenuViews).
// It is a popover, as the wide screen's Portfolio dropdown is (NavDropdown):
// its button is a real button named Menu, its links follow it in the tab
// order, and Escape closes it, putting focus back on the button. The page behind it hides while it is
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
      <Popover className="flex items-center">
        {({ open: isOpen, close }) => (
          <>
            <PopoverButton as={MobileNavButton} isActive={isOpen} />
            <MenuPane
              isOpen={isOpen}
              close={close}
              pathname={pathname}
              routes={routes}
            />
          </>
        )}
      </Popover>
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
    setClosing(!isOpen && !isStill());
  }

  // The page chosen from the menu has come in under it. (Only on a change
  // of page: the popover's close() also puts focus back on its button.)
  const lastPath = useRef(pathname);
  useEffect(() => {
    if (pathname === lastPath.current) return;
    lastPath.current = pathname;
    if (isOpen) close();
  }, [pathname, isOpen, close]);
  const closeMenu = useCallback(() => close(), [close]);

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
      <PopoverPanel
        static
        className="relative flex w-auto flex-col focus:outline-none"
      >
        {state !== 'closed' && (
          <MenuViews pathname={pathname} routes={routes} close={closeMenu} />
        )}
      </PopoverPanel>
    </div>
  );
}

// The menu's links, or one route's pages (Portfolio's) after its button is
// tapped. Mounted only while the menu shows, so it opens on the links. A
// change of view moves focus to the new view's first control (the way
// back), and back to Portfolio, so a keyboard keeps its place.
function MenuViews({
  pathname,
  routes,
  close,
}: MobileNavProps & { close: () => void }) {
  const [opened, setOpened] = useState<Route | null>(null);
  const first = useRef<HTMLButtonElement>(null);
  const turned = useRef(false);
  useEffect(() => {
    if (turned.current) first.current?.focus();
  }, [opened]);
  const turn = (route: Route | null) => {
    turned.current = true;
    setOpened(route);
  };

  if (opened) {
    return (
      <>
        <button
          ref={first}
          type="button"
          onClick={() => turn(null)}
          className="group flex w-full text-center outline-none"
        >
          <span className={`text-h5 ${linkStyle({ isFirst: true })}`}>
            <span aria-hidden className="mr-3">
              ‹
            </span>
            {opened.label}
          </span>
        </button>
        {opened.children!.map(({ label, path }) => (
          <div key={path} className="flex flex-nowrap">
            <NavLink
              isSub
              path={path}
              isActive={pathname === path}
              label={label}
              onClick={close}
            />
          </div>
        ))}
      </>
    );
  }

  return routes.map((route, index) => {
    const { label, path, children = [] } = route;
    const isFirst = index === 0;
    if (children.length)
      return (
        <button
          key={path}
          ref={first}
          type="button"
          onClick={() => turn(route)}
          className="group flex w-full text-center outline-none"
        >
          <span
            className={`text-h5 ${linkStyle({
              isActive: isRouteActive(path, pathname),
              isFirst,
            })}`}
          >
            {label}
          </span>
        </button>
      );
    return (
      <div key={path} className="flex flex-nowrap">
        <NavLink
          path={path}
          isActive={pathname === path}
          isFirst={isFirst}
          label={label}
          onClick={close}
        />
      </div>
    );
  });
}
