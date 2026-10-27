import { Route } from '.';
import NavLink from './NavLink';
import useGradientShift from './useGradientShift';

type DesktopNavProps = {
  pathname: string;
  backgroundOffsetLeft: number;
  routes: Route[];
};

export default function DesktopNav({
  pathname,
  backgroundOffsetLeft,
  routes,
}: DesktopNavProps) {
  const listRef = useGradientShift(backgroundOffsetLeft);

  return (
    <div className="pointer-events-auto hidden md:flex">
      <div
        ref={listRef}
        className="relative m-3 flex w-auto flex-row focus:outline-none"
      >
        {routes.map(({ label, path }) => {
          const isActive = pathname === path;
          const showLink = !!label;

          if (!showLink) return null;

          return (
            <NavLink
              key={label}
              path={path}
              isActive={isActive}
              label={label}
            />
          );
        })}
      </div>
    </div>
  );
}
