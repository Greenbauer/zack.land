import { cva } from 'class-variance-authority';
import { ButtonHTMLAttributes, ReactElement } from 'react';

import Spinner from './Spinner';

const buttonStyle = cva(
  'max-w-fit bg-[length:500%_100%] bg-left px-6 py-2 font-sans text-lg font-normal uppercase tracking-wider text-black',
  {
    variants: {
      disabled: {
        true: 'bg-gray text-gray-light cursor-not-allowed opacity-50',
        false:
          'bg-gradient-button focus-within:text-white hover:bg-right hover:text-white focus:text-black active:text-white',
      },
    },
    defaultVariants: {
      disabled: false,
    },
  },
);

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  href?: string;
  children: ReactElement | string;
  target?: '_blank' | '_self';
  disabled?: boolean;
  showSpinner?: boolean;
}

export default function Button({
  children,
  href,
  target,
  disabled,
  showSpinner = false,

  ...props
}: ButtonProps) {
  if (showSpinner)
    return (
      <div className="p-1.5">
        <Spinner size="sm" />
      </div>
    );

  if (!!href) {
    return (
      <a
        className={buttonStyle({ disabled })}
        href={href}
        target={target}
        rel={target === '_blank' ? 'noreferrer' : undefined}
        style={{
          transition: 'transform 0.8s, color 0.3s, background-position-x 0.7s',
          transitionDelay: '0s, 0.2s, 0s',
        }}
      >
        {children}
      </a>
    );
  }

  return (
    <button
      className={buttonStyle({ disabled })}
      style={{
        transition: 'transform 0.8s, color 0.3s, background-position-x 0.7s',
        transitionDelay: '0s, 0.2s, 0s',
      }}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}
