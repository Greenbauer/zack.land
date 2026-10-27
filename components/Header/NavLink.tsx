import { cva } from 'class-variance-authority';
import Link from 'next/link';
import { ForwardedRef, forwardRef } from 'react';

// Only the current page's link is underlined, like a link in running text:
// the accent, with the underline in the underline colour, turning the accent
// when hovered. Hovering or focusing another link turns it the accent too,
// with no underline.
const linkStyle = cva(
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

type NavLinkProps = {
  path: string;
  isActive: boolean;
  isFirst?: boolean;
  label: string;
  onClick?: () => void;
};

function NavLink(
  { path, isActive, isFirst, label, onClick }: NavLinkProps,
  ref: ForwardedRef<HTMLHeadingElement>,
) {
  return (
    <h5 ref={ref} className="w-full">
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
