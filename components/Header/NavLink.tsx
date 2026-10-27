import { cva } from 'class-variance-authority';
import Link from 'next/link';
import { ForwardedRef, forwardRef } from 'react';

const linkStyle = cva(
  'group relative isolate block w-full border-b border-gray-dark px-6 py-3 uppercase hover:text-white md:border-none md:py-2',
  {
    variants: {
      isActive: {
        true: 'text-white',
        false: 'text-gray-lightest',
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
      <Link href={path} className="flex w-full text-center" onClick={onClick}>
        <div className={linkStyle({ isActive, isFirst })}>
          {/* The gradient shows only behind the hovered link, sliding with
              the pointer through its list's --nav-x. */}
          <span
            aria-hidden
            className="bg-gradient absolute inset-0 -z-10 bg-[length:300%_100%] opacity-0 transition-[background-position-x] duration-700 group-hover:opacity-100"
            style={{ backgroundPositionX: 'var(--nav-x)' }}
          />
          {label}
        </div>
      </Link>
    </h5>
  );
}

export default forwardRef(NavLink);
