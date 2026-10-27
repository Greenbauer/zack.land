import { Menu } from '@headlessui/react';
import { cva } from 'class-variance-authority';

import { Route } from '..';
import NavLink from '../NavLink';
import MobileNavButton from './MobileNavButton';

// The open menu is a pane of the cards' frosted glass (data-glass, drawn in
// the 3D scene by components/Background/glass.ts) over the whole screen. The
// glass rounds and feathers a pane's corners (at least 120px), so the pane
// reaches 15rem past every edge of the screen, its padding putting the links
// back where they were: its corners fall off screen and the menu stays square.
// Its links take the card's ink, the one colour the glass keeps readable (the
// current page keeps its underline), which follows the glass (globals.css).
// The page behind it hides while it is open (.mobile-menu there).
const mobileNavBackgroundStyle = cva(
  'mobile-menu -left-60 -top-60 h-[calc(100%+30rem)] w-[calc(100vw+30rem)] p-60 pt-80 [--sky-accent:var(--card-ink)] [--sky-faint:color-mix(in_srgb,var(--card-ink)_30%,transparent)] [--sky-muted:var(--card-ink)] [--sky-text:var(--card-ink)] [--sky-underline:var(--card-underline)]',
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
            <div data-glass className={mobileNavBackgroundStyle({ isOpen })}>
              <Menu.Items className="relative flex w-auto flex-col focus:outline-none">
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
