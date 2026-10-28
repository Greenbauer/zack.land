'use client';

import { useRouter } from 'next/navigation';
import { ReactNode, useEffect, useRef } from 'react';

// How long the title takes to slide away, in milliseconds.
const LEAVE_MS = 600;

// Where a click on a link should take the site after the title has slid
// away, or null to let it go at once: a plain left click on a link to
// another page of this site, in this tab.
export function slideAwayTo(
  click: {
    button: number;
    metaKey: boolean;
    ctrlKey: boolean;
    shiftKey: boolean;
    altKey: boolean;
  },
  link: { href: string; target: string },
  here: string,
): string | null {
  if (click.button !== 0) return null;
  if (click.metaKey || click.ctrlKey || click.shiftKey || click.altKey)
    return null;
  if (link.target && link.target !== '_self') return null;
  const url = new URL(link.href, here);
  const from = new URL(here);
  if (url.origin !== from.origin || url.pathname === from.pathname) return null;
  return url.pathname + url.search + url.hash;
}

// The home page's title box. It slides in from wholly off the window's right
// side as the page opens (animate-from-right), and when a link to another
// page of the site is clicked it slides back off to the right, gathering
// speed, before the site goes there; the 3D name follows its words both
// ways (Background/TitleName.tsx). A click with a modifier key, a link to
// another site or a new tab, and reduced motion go at once. On a wide screen
// the head centres itself in the space left of it (data-head-avoid,
// components/Background/headPlace.ts), measured where the box rests.
export default function TitleBox({ children }: { children: ReactNode }) {
  const box = useRef<HTMLDivElement | null>(null);
  const router = useRouter();

  useEffect(() => {
    let leaving = false;
    // Ahead of the link's own handler (Next's Link leaves a prevented click
    // alone), so the page stays until the title has gone.
    const onClick = (event: MouseEvent) => {
      const link = (event.target as Element).closest?.('a');
      if (
        event.defaultPrevented ||
        !link ||
        matchMedia('(prefers-reduced-motion: reduce)').matches
      )
        return;
      const to = slideAwayTo(event, link, location.href);
      if (!to) return;
      event.preventDefault();
      if (leaving || !box.current) return;
      leaving = true;
      box.current
        .animate(
          [{ translate: '0 0' }, { translate: 'calc(100vw + 4rem) 0' }],
          {
            duration: LEAVE_MS,
            easing: 'cubic-bezier(0.32, 0, 0.67, 0)',
            fill: 'forwards',
          },
        )
        .finished.then(() => router.push(to));
    };
    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, [router]);

  return (
    <div
      ref={box}
      data-head-avoid
      className="flex w-full flex-col text-center motion-safe:animate-from-right md:gap-6 lg:max-w-lg lg:text-left"
    >
      {children}
    </div>
  );
}
