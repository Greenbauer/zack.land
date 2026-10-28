import { ReactNode } from 'react';

// The home page's title box. It slides in from wholly off the window's right
// side as the page opens (animate-from-right), and slides back off to the
// right as the site goes to another page (data-leave, PageLeave.tsx); the 3D
// name follows its words both ways (Background/TitleName.tsx). On a wide
// screen the head centres itself in the space left of it (data-head-avoid,
// components/Background/headPlace.ts), measured where the box rests.
export default function TitleBox({ children }: { children: ReactNode }) {
  return (
    <div
      data-head-avoid
      data-leave
      className="flex w-full flex-col text-center motion-safe:animate-from-right max-md:relative max-md:top-[calc(40px_+_10dvh_-_var(--page-top))] max-md:-translate-y-1/2 md:gap-6 lg:max-w-lg lg:text-left"
    >
      {children}
    </div>
  );
}
