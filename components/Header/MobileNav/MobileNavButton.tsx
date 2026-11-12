import { ForwardedRef, forwardRef } from 'react';

// The lines take the sky's text colour, open or closed: the open menu's
// glass matches the sky around it. Open, the middle one slides away and the
// other two turn to a cross.
const LINE =
  'absolute block h-px w-full bg-[color:var(--sky-text)] transition-all duration-200 ease-in-out';

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
      <span
        className={`${LINE} ${isActive ? 'top-3 rotate-[135deg] opacity-100' : 'left-0 top-0 opacity-100'}`}
      />
      <span
        className={`${LINE} ${isActive ? '-left-16 top-3 opacity-0' : 'left-0 top-3 opacity-100'}`}
      />
      <span
        className={`${LINE} ${isActive ? 'top-3 rotate-[-135deg] opacity-100' : 'left-0 top-6 opacity-100'}`}
      />
    </button>
  );
}

export default forwardRef(MobileNavButton);
