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
      <div className="relative m-3 flex w-auto flex-row focus:outline-none">
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
