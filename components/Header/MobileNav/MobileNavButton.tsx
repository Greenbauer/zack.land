import { cva } from 'class-variance-authority';
import { ForwardedRef, forwardRef } from 'react';

const lineStyle = cva(
  // The lines take the sky's text colour, open or closed: the open menu's
  // glass matches the sky around it.
  'absolute block h-px w-full bg-[color:var(--sky-text)] transition-all duration-200 ease-in-out',
  {
    variants: {
      isActive1: {
        false: 'left-0 top-0 opacity-100 ',
        true: 'top-3 rotate-[135deg] opacity-100 ',
      },
      isActive2: {
        false: 'left-0 top-3 opacity-100',
        true: '-left-16 top-3 opacity-0',
      },
      isActive3: {
        false: 'left-0 top-6 opacity-100 ',
        true: 'top-3 rotate-[-135deg] opacity-100',
      },
    },
  },
);

type MobileNavButtonProps = {
  isActive: boolean;
};

// A real button, named Menu (its open state is aria-expanded, which the
// popover sets), in the tab order, with a ring when focused by the keyboard.
function MobileNavButton(
  { isActive, ...props }: MobileNavButtonProps,
  ref: ForwardedRef<HTMLButtonElement>,
) {
  return (
    <button
      ref={ref}
      type="button"
      aria-label="Menu"
      className="relative z-10 mt-4 inline-block size-10 cursor-pointer rounded-md outline-none outline-offset-4 transition-transform duration-500 ease-in-out focus-visible:outline-[color:var(--sky-text)]"
      {...props}
    >
      <span className={lineStyle({ isActive1: isActive })} />
      <span className={lineStyle({ isActive2: isActive })} />
      <span className={lineStyle({ isActive3: isActive })} />
    </button>
  );
}

export default forwardRef(MobileNavButton);
