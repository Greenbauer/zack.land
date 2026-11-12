import { ButtonHTMLAttributes, ReactElement } from 'react';

import Spinner from './Spinner';

// A button rests on the light end of its gradient and sweeps to the dark
// end on hover; on a light glass card (data-sky, styles/globals.css) the
// other way round ([[data-sky=light]_&]), so it always stands out from
// the glass.
const BUTTON =
  'bg-gradient-button max-w-fit rounded-md bg-[length:500%_100%] bg-left px-6 py-2 font-sans text-lg font-normal uppercase tracking-wider text-head-dark [[data-sky=light]_&]:bg-right [[data-sky=light]_&]:text-head-light';
const ENABLED =
  'focus-within:text-head-light hover:bg-right hover:text-head-light focus:text-head-dark active:text-head-light [[data-sky=light]_&]:hover:bg-left [[data-sky=light]_&]:hover:text-head-dark [[data-sky=light]_&]:focus:text-head-light [[data-sky=light]_&]:active:text-head-dark';
// The button as it rests, only see-through: no grey.
const DISABLED = 'cursor-not-allowed opacity-40';
const SWEEP = {
  transition: 'transform 0.8s, color 0.3s, background-position-x 1.1s',
  transitionDelay: '0s, 0.2s, 0s',
};

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
  className,
  ...props
}: ButtonProps) {
  const look = `${BUTTON} ${disabled ? DISABLED : ENABLED} ${className ?? ''}`;
  if (!!href) {
    return (
      <a
        className={look}
        href={href}
        target={target}
        rel={target === '_blank' ? 'noreferrer' : undefined}
        style={SWEEP}
      >
        {children}
      </a>
    );
  }

  // While its action runs, the button shows only a spinner in its place,
  // but stays in the page (marked disabled, not removed) so focus stays on
  // it; the form ignores a second press while it sends (Form.tsx).
  if (showSpinner)
    return (
      <button {...props} aria-disabled className="p-1.5">
        <Spinner />
        <span className="sr-only">{children}</span>
      </button>
    );

  return (
    <button className={look} style={SWEEP} disabled={disabled} {...props}>
      {children}
    </button>
  );
}
