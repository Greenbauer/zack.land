'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { slideAwayTo } from './leaveTo';
import { announceTurn } from './PageScroller/pageGlide';

// How the page moves out, in milliseconds: gathering speed, as a post's card
// leaves when the portfolio turns (Post.tsx's LEAVING).
const CARD_MS = 800;
const CONTENT_MS = 650;
const TITLE_MS = 600;
// The image tiles' melt out (components/mediaMelter.ts) ends by then: up to
// 1.2s, after a wait of up to 0.3s.
const TILES_MS = 1500;
const GATHER = 'cubic-bezier(0.32, 0, 0.67, 0)';

// When a link to another page of the site is clicked, the page moves out
// before the site goes there, the way a post leaves as the portfolio turns:
// every card showing (the contact form, a post's card) slides on off the
// window's right side, its glass whole, while what is on it fades; anything
// marked data-leave (the home page's title) slides off to the right; and the
// image tiles slide off to the right and the scroll arrows fade
// (body[data-leaving], styles/globals.css). Then the next page arrives as it
// does on opening. A click with a modifier key, a link to another site or a
// new tab, the browser's back and forward, and reduced motion go at once.
export default function PageLeave() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    let leaving = false;
    // Ahead of the link's own handler (Next's Link leaves a prevented click
    // alone), so the page stays until it has moved out.
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
      if (leaving) return;
      leaving = true;
      document.body.toggleAttribute('data-leaving', true);
      announceTurn({ to: -1 });
      const out = (kind: 'card' | 'title') => ({
        duration: kind === 'title' ? TITLE_MS : CARD_MS,
        easing: GATHER,
        fill: 'forwards' as const,
      });
      for (const card of shownCards()) {
        card.animate([{ translate: 'calc(100vw + 20rem) 0' }], out('card'));
        for (const part of card.children)
          part.animate([{ opacity: 0 }], {
            duration: CONTENT_MS,
            easing: GATHER,
            fill: 'forwards',
          });
      }
      for (const element of document.querySelectorAll('[data-leave]'))
        element.animate([{ translate: 'calc(100vw + 4rem) 0' }], out('title'));
      setTimeout(() => router.push(to), TILES_MS);
    };
    document.addEventListener('click', onClick, true);
    return () => {
      document.removeEventListener('click', onClick, true);
      document.body.toggleAttribute('data-leaving', false);
    };
  }, [router, pathname]);

  return null;
}

// The cards on screen and not hidden (a post's card while another post
// shows is hidden, Post.tsx).
const shownCards = () =>
  [...document.querySelectorAll<HTMLElement>('section')].filter((card) => {
    const box = card.getBoundingClientRect();
    return (
      getComputedStyle(card).visibility !== 'hidden' &&
      box.right > 0 &&
      box.left < innerWidth &&
      box.bottom > 0 &&
      box.top < innerHeight
    );
  });
