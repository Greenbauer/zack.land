import {
  Popover,
  PopoverBackdrop,
  PopoverButton,
  PopoverPanel,
} from '@headlessui/react';

import NavLink, { linkStyle } from './NavLink';

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
// outside or Escape. Its links keep the header links' colours, read from the
// sky behind the header (useSkyColours, Header): the current page's in the
// accent, the other in the text colour, as in the top row.
// While it is open everything under it blurs, as the scene does behind a
// focused form field: a backdrop over the whole window, below the header's
// links, blurs the 3D scene and the page alike (FOCUS_BLUR_PX, over
// FOCUS_BLUR_SECONDS), and a click on it only closes the pane. The pane's
// own glass sits on top of that blur: the scene's glass lies under the
// backdrop, so the pane gets the photo glass's frost and lenses instead, on
// a layer just before it (data-photo-lens; data-glass-over keeps it on
// whatever is under the pane: components/Background/photoLens.ts).
export default function NavDropdown({
  label,
  isActive,
  pathname,
  items,
}: NavDropdownProps) {
  return (
    <Popover className="relative">
      <PopoverBackdrop
        transition
        className="fixed inset-0 -z-10 backdrop-blur-[6px] transition-opacity duration-300 data-[closed]:opacity-0"
      />
      {/* data-nav-dropdown: the home page's idle hint points at it (Home/NavHint.tsx). */}
      <PopoverButton data-nav-dropdown className="group flex outline-none">
        <span className={linkStyle({ isActive })}>{label}</span>
      </PopoverButton>
      <div
        data-photo-lens
        aria-hidden
        className="pointer-events-none fixed [backdrop-filter:var(--photo-lens,none)]"
      />
      <PopoverPanel
        transition
        data-glass
        data-glass-over
        className="absolute left-0 top-full mt-4 flex min-w-60 flex-col rounded-3xl py-4 transition-[transform,opacity] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] data-[closed]:opacity-0 data-[leave]:duration-200 data-[leave]:ease-in data-[enter]:[transition-delay:0s,0.1s] motion-safe:data-[closed]:-translate-y-12"
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
