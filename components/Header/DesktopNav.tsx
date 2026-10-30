import { Route } from '.';
import NavDropdown from './NavDropdown';
import NavLink, { isRouteActive } from './NavLink';

type DesktopNavProps = {
  pathname: string;
  routes: Route[];
};

export default function DesktopNav({ pathname, routes }: DesktopNavProps) {
  return (
    <div className="pointer-events-auto hidden md:flex">
      {/* Pulled left by a link's own padding (px-6, NavLink.tsx), so the
          first link's word starts at the frame's edge, in line with the
          footer's icons and the page below. */}
      <div className="relative -ml-6 flex w-auto flex-row focus:outline-none">
        {routes.map(({ label, path, children }) => {
          if (!label) return null;
          const isActive = isRouteActive(path, pathname);

          return children ? (
            <NavDropdown
              key={label}
              label={label}
              isActive={isActive}
              pathname={pathname}
              items={children}
            />
          ) : (
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
