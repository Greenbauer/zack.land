import { cva } from 'class-variance-authority';
import Link from 'next/link';
import { ForwardedRef, forwardRef } from 'react';

// Only the current page's link is underlined, like a link in running text:
// the accent, with the underline in the underline colour, turning the accent
// when hovered. Hovering or focusing another link turns it the accent too,
// with no underline.
export const linkStyle = cva(
  'block w-full border-b border-[color:var(--sky-faint)] px-6 py-3 uppercase underline-offset-[6px] transition-[color,text-decoration-color] duration-300 group-hover:text-[color:var(--sky-accent)] group-focus-visible:text-[color:var(--sky-accent)] md:border-none md:py-2',
  {
    variants: {
      isActive: {
        true: 'text-[color:var(--sky-accent)] underline decoration-[color:var(--sky-underline)] group-hover:decoration-[color:var(--sky-accent)] group-focus-visible:decoration-[color:var(--sky-accent)]',
        false: 'text-[color:var(--sky-muted)]',
      },
      isFirst: {
        true: 'border-t',
      },
    },
    defaultVariants: {
      isActive: false,
      isFirst: false,
    },
  },
);

// On the phone menu's pane of the cards' glass, links take the card's ink,
// the one colour the glass keeps readable, which follows the glass
// (globals.css); the current page keeps its underline.
export const ON_GLASS =
  '[--sky-accent:var(--card-ink)] [--sky-faint:color-mix(in_srgb,var(--card-ink)_30%,transparent)] [--sky-muted:var(--card-ink)] [--sky-text:var(--card-ink)] [--sky-underline:var(--card-underline)]';

// Whether a route's link is the current page's: home only at /, any other
// at its path or a page under it.
export const isRouteActive = (path: string, pathname: string) =>
  path === '/'
    ? pathname === '/'
    : pathname === path || pathname.startsWith(`${path}/`);

type NavLinkProps = {
  path: string;
  isActive: boolean;
  isFirst?: boolean;
  label: string;
  // A page under another in the phone menu: set smaller.
  isSub?: boolean;
  onClick?: () => void;
};

function NavLink(
  { path, isActive, isFirst, label, isSub, onClick }: NavLinkProps,
  ref: ForwardedRef<HTMLHeadingElement>,
) {
  return (
    <h5 ref={ref} className={`w-full ${isSub ? 'max-md:!text-lg' : ''}`}>
      <Link
        href={path}
        className="group flex w-full text-center outline-none"
        onClick={onClick}
        aria-current={isActive ? 'page' : undefined}
      >
        <div className={linkStyle({ isActive, isFirst })}>{label}</div>
      </Link>
    </h5>
  );
}

export default forwardRef(NavLink);
