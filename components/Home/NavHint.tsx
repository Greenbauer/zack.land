'use client';

import { CSSProperties, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

import { Chevrons } from '@/components/PageScroller/Chevrons';

import { watchIdle } from './idleWatch';

// How long the home page waits, with nothing moving, before it points at
// Portfolio, in milliseconds.
export const IDLE_MS = 10_000;

// On the home page on a wide screen, once the visitor has done nothing for
// IDLE_MS (no pointer, wheel, key, touch or scroll): the portfolio pages'
// scroll arrow (ScrollArrows.tsx), its chevrons sliding up on a close pane
// of the cards' glass, just under the header's Portfolio (data-nav-dropdown,
// Header/NavDropdown.tsx), pointing up at it. It fades in, and out again at
// the next move, and waits again. On a phone Portfolio is behind the menu
// button, so there is none.
export default function NavHint() {
  const [isIdle, setIsIdle] = useState(false);
  const [at, setAt] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => watchIdle(window, IDLE_MS, setIsIdle), []);

  // Under Portfolio, wherever the header puts it; nowhere while it is not
  // showing (a phone's menu holds it).
  useEffect(() => {
    const place = () => {
      const link = document.querySelector<HTMLElement>('[data-nav-dropdown]');
      if (!link?.checkVisibility()) return setAt(null);
      const box = link.getBoundingClientRect();
      setAt({ x: box.left + box.width / 2, y: box.bottom });
    };
    place();
    addEventListener('resize', place);
    return () => removeEventListener('resize', place);
  }, [isIdle]);

  if (!at) return null;
  const isShown = isIdle;
  return createPortal(
    <div
      data-glass={isShown || undefined}
      data-glass-near={isShown || undefined}
      aria-hidden
      style={
        { left: `${at.x}px`, top: `calc(${at.y}px + 0.75rem)` } as CSSProperties
      }
      className={`pointer-events-none fixed z-30 -translate-x-1/2 rounded-3xl px-10 pb-2 pt-5 transition-opacity duration-500 [--sky-text:var(--card-ink)] ${
        isShown ? 'opacity-100' : 'invisible opacity-0'
      }`}
    >
      {/* The scroll arrow's chevrons, turned to point up and shrunk so their
          slide ends at the top of their box. */}
      <span className="relative block h-12 w-16">
        <span className="absolute left-1/2 top-11 block rotate-90 scale-[0.7]">
          <Chevrons />
        </span>
      </span>
    </div>,
    document.body,
  );
}
