import { cva } from 'class-variance-authority';

import { Route } from '.';
import NavLink from './NavLink';
import NavListBackground from './NavListBackground';

const desktopNavStyle = cva('hidden border-b md:flex', {
  variants: {
    isScrolling: {
      true: 'border-none',
      false: 'border-gray-dark',
    },
  },
  defaultVariants: {
    isScrolling: false,
  },
});

type DesktopNavProps = {
  pathname: string;
  backgroundOffsetLeft: number;
  isScrolling: boolean;
  routes: Route[];
};

export default function DesktopNav({
  pathname,
  backgroundOffsetLeft,
  isScrolling,
  routes,
}: DesktopNavProps) {
  return (
    <div className={desktopNavStyle({ isScrolling })}>
      <div className="relative m-3 flex w-auto flex-row focus:outline-none">
        {routes.map(({ label, path }) => {
          const isActive = pathname === path;
          const showLink = !!label;

          if (!showLink) return null;

          return (
            <NavLink
              key={label}
              path={path}
              isActive={isActive}
              isScrolling={isScrolling}
              label={label}
            />
          );
        })}
        <NavListBackground offsetLeft={backgroundOffsetLeft} />
      </div>
    </div>
  );
}
