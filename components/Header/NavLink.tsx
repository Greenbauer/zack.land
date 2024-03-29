import { cva } from 'class-variance-authority';
import Link from 'next/link';
import { ForwardedRef, forwardRef } from 'react';

const linkStyle = cva(
  'border-gray-dark relative block w-full border-b px-6 py-3 uppercase hover:bg-transparent hover:text-white focus:bg-transparent md:border-none md:py-2',
  {
    variants: {
      isActive: {
        true: 'text-white',
        false: 'text-gray-lightest',
      },
      isFirst: {
        true: 'border-t',
      },
      isScrolling: {
        true: 'bg-gray-darkest',
        false: 'bg-black',
      },
    },
    defaultVariants: {
      isActive: false,
      isFirst: false,
      isScrolling: false,
    },
  },
);

type NavLinkProps = {
  path: string;
  isActive: boolean;
  isFirst?: boolean;
  isScrolling?: boolean;
  label: string;
  onClick?: () => void;
};

function NavLink(
  { path, isActive, isFirst, isScrolling, label, onClick }: NavLinkProps,
  ref: ForwardedRef<HTMLHeadingElement>,
) {
  return (
    <h5 ref={ref} className="w-full">
      <Link href={path} className="flex w-full text-center" onClick={onClick}>
        <div className={linkStyle({ isActive, isFirst, isScrolling })}>
          {label}
        </div>
      </Link>
    </h5>
  );
}

export default forwardRef(NavLink);
