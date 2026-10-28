import { describe, expect, it } from 'vitest';

import { isRouteActive } from './NavLink';

describe("a header link's current-page underline", () => {
  it('marks Portfolio on any page under it', () => {
    expect(isRouteActive('/portfolio', '/portfolio/web-apps')).toBe(true);
    expect(isRouteActive('/portfolio', '/portfolio/miscellaneous')).toBe(true);
    expect(isRouteActive('/portfolio', '/contact')).toBe(false);
  });

  it('marks Home only on the home page', () => {
    expect(isRouteActive('/', '/')).toBe(true);
    expect(isRouteActive('/', '/contact')).toBe(false);
  });

  it('does not mistake a path that only starts the same way', () => {
    expect(isRouteActive('/contact', '/contacts')).toBe(false);
  });
});
