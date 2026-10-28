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
// the pages under it, instead of going to a page itself. It slides down 3rem
// into place, slowing to a stop, and starts fading in as it moves (the glass
// fades with it); it fades out quickly, and closes on a choice, a click
// outside or Escape.
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
        className={`absolute left-0 top-full mt-4 flex min-w-60 flex-col rounded-3xl py-4 transition-[transform,opacity] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] data-[closed]:opacity-0 data-[leave]:duration-200 data-[leave]:ease-in data-[enter]:[transition-delay:0s,0.1s] motion-safe:data-[closed]:-translate-y-12 ${ON_GLASS}`}
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
