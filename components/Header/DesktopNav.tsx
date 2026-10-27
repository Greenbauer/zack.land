import { Route } from '.';
import NavLink from './NavLink';

type DesktopNavProps = {
  pathname: string;
  routes: Route[];
};

export default function DesktopNav({ pathname, routes }: DesktopNavProps) {
  return (
    <div className="pointer-events-auto hidden md:flex">
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
              label={label}
            />
          );
        })}
      </div>
    </div>
  );
}
