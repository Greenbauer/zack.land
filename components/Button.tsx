import { cva } from 'class-variance-authority';
import { ButtonHTMLAttributes, ReactElement } from 'react';

import Spinner from './Spinner';

// A button rests on the light end of its gradient and sweeps to the dark
// end on hover; on a light glass card (data-sky, styles/globals.css) the
// other way round ([[data-sky=light]_&]), so it always stands out from
// the glass.
const buttonStyle = cva(
  'max-w-fit rounded-md bg-[length:500%_100%] bg-left px-6 py-2 font-sans text-lg font-normal uppercase tracking-wider text-head-dark [[data-sky=light]_&]:bg-right [[data-sky=light]_&]:text-head-light',
  {
    variants: {
      disabled: {
        // The button as it rests, only see-through: no grey.
        true: 'bg-gradient-button cursor-not-allowed opacity-40',
        false:
          'bg-gradient-button focus-within:text-head-light hover:bg-right hover:text-head-light focus:text-head-dark active:text-head-light [[data-sky=light]_&]:hover:bg-left [[data-sky=light]_&]:hover:text-head-dark [[data-sky=light]_&]:focus:text-head-light [[data-sky=light]_&]:active:text-head-dark',
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
          transition: 'transform 0.8s, color 0.3s, background-position-x 1.1s',
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
        transition: 'transform 0.8s, color 0.3s, background-position-x 1.1s',
        transitionDelay: '0s, 0.2s, 0s',
      }}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}
