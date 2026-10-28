import { Popover, PopoverButton, PopoverPanel } from '@headlessui/react';

import NavLink, { linkStyle, ON_GLASS } from './NavLink';

type NavDropdownProps = {
  label: string;
  isActive: boolean;
  pathname: string;
  items: { label: string; path: string }[];
};

// A header link that opens a small pane of the cards' frosted glass
// (data-glass, drawn in the 3D scene by components/Background/glass.ts) with
// the pages under it, instead of going to a page itself. It fades in and out
// (the glass fades with it), and closes on a choice, a click outside or
// Escape.
export default function NavDropdown({
  label,
  isActive,
  pathname,
  items,
}: NavDropdownProps) {
  return (
    <Popover className="relative">
      <PopoverButton className="group flex outline-none">
        <span className={linkStyle({ isActive })}>{label}</span>
      </PopoverButton>
      <PopoverPanel
        transition
        data-glass
        className={`absolute left-0 top-full mt-4 flex min-w-60 flex-col rounded-3xl py-4 transition duration-300 ease-out data-[closed]:-translate-y-2 data-[closed]:opacity-0 ${ON_GLASS}`}
      >
        {({ close }) => (
          <>
            {items.map((item) => (
              <NavLink
                key={item.path}
                path={item.path}
                label={item.label}
                isActive={pathname === item.path}
                onClick={() => close()}
              />
            ))}
          </>
        )}
      </PopoverPanel>
    </Popover>
  );
}
