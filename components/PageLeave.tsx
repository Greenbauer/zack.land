'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { viewBound } from './Background/skyViews';
import { slideAwayTo } from './leaveTo';

// How the page moves out, in milliseconds, as a post's card leaves when the
// portfolio turns (Post.tsx's LEAVING): what is on a card fades, and as that
// ends the card gathers speed.
const CONTENT_MS = 400;
const CARD_WAIT_MS = 300;
const CARD_MS = 800;
const TITLE_MS = 600;
// The image tiles' slide out (styles/globals.css, body[data-leaving]) ends
// by then: 0.6s, after a wait of up to 0.24s.
const TILES_MS = 850;
const GATHER = 'cubic-bezier(0.32, 0, 0.67, 0)';

// When a link to another page of the site is clicked, the page moves out
// before the site goes there, the way a post leaves as the portfolio turns:
// every card showing (the contact form, a post's card) slides on off the
// window's right side, its glass whole, after what is on it has faded; anything
// marked data-leave (the home page's title) slides off to the right; and the
// image tiles slide off to the right and the scroll arrows fade
// (body[data-leaving], styles/globals.css). Then the next page arrives as it
// does on opening. A click with a modifier key, a link to another site or a
// new tab, the browser's back and forward, and reduced motion go at once.
// The sky sets off for the next page's home with the click (viewBound).
//
// A link in the phone menu has no page to move out: the page is hidden under
// the menu, and closing the menu now would bring it back. So the click goes no
// further (the menu would close on it), the site goes there at once, and the
// menu stays until the next page is in (MobileNav closes it then): the head
// goes straight from behind the menu to its place on the next page.
export default function PageLeave() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    let leaving = false;
    // Ahead of the link's own handler (Next's Link leaves a prevented click
    // alone), so the page stays until it has moved out.
    const onClick = (event: MouseEvent) => {
      const link = (event.target as Element).closest?.('a');
      if (event.defaultPrevented || !link) return;
      const to = slideAwayTo(event, link, location.href);
      if (!to) return;
      const page = new URL(to, location.href).pathname;
      const inMenu = link.closest('.mobile-menu') !== null;
      if (!inMenu && matchMedia('(prefers-reduced-motion: reduce)').matches) {
        viewBound(page);
        return;
      }
      event.preventDefault();
      if (inMenu) event.stopPropagation();
      if (leaving) return;
      leaving = true;
      viewBound(page);
      if (inMenu) {
        router.push(to);
        return;
      }
      document.body.toggleAttribute('data-leaving', true);
      const cards = shownCards();
      for (const card of cards) {
        card.animate([{ translate: 'calc(100vw + 20rem) 0' }], {
          delay: CARD_WAIT_MS,
          duration: CARD_MS,
          easing: GATHER,
          fill: 'forwards',
        });
        for (const part of card.children)
          part.animate([{ opacity: 0 }], {
            duration: CONTENT_MS,
            easing: 'ease-in',
            fill: 'forwards',
          });
      }
      for (const element of document.querySelectorAll('[data-leave]'))
        element.animate([{ translate: 'calc(100vw + 4rem) 0' }], {
          duration: TITLE_MS,
          easing: GATHER,
          fill: 'forwards',
        });
      setTimeout(
        () => router.push(to),
        Math.max(TILES_MS, cards.length ? CARD_WAIT_MS + CARD_MS : 0),
      );
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
