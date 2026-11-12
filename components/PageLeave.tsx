'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';

import motion from '@/theme/motion.json';

import { viewBound } from './Background/skyViews';
import { CARD_MS, slideAwayTo, TILES_MS, TITLE_MS } from './leaveTo';
import { announceTurn } from './PageScroller/pageGlide';
import { isStill } from './viewport';

// Leaving, the cards and the title gather speed, as a post's card does
// (Post.tsx's LEAVING), what is on a card fading evenly for as long as the
// card slides.
const GATHER = motion.ease.gather;

// When a link to another page of the site is clicked, the page moves out
// before the site goes there, the way a post leaves as the portfolio turns:
// every card showing (the contact form, a post's card) slides on off the
// window's right side, its glass whole, while what is on it fades; anything
// marked data-leave (the home page's title) slides off to the right; and the
// image tiles melt off to the right (MediaMelt.tsx, or slide where they can't:
// body[data-leaving], styles/globals.css) and the scroll arrows fade. Then the next page arrives as it
// does on opening. A click with a modifier key, a link to another site or a
// new tab, the browser's back and forward, and reduced motion go at once.
// The sky sets off for the next page's home with the click (viewBound). The
// browser's back or forward while the page moves out calls the trip off, so
// the site stays where the visitor sent it.
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
    let going = 0;
    const callOff = () => clearTimeout(going);
    // Ahead of the link's own handler (Next's Link leaves a prevented click
    // alone), so the page stays until it has moved out.
    const onClick = (event: MouseEvent) => {
      const link = (event.target as Element).closest?.('a');
      if (event.defaultPrevented || !link) return;
      const to = slideAwayTo(event, link, location.href);
      if (!to) return;
      const page = new URL(to, location.href).pathname;
      const inMenu = link.closest('.mobile-menu') !== null;
      if (!inMenu && isStill()) {
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
      announceTurn({ to: -1 });
      for (const card of shownCards()) {
        card.animate([{ translate: `${motion.offWindow} 0` }], {
          duration: CARD_MS,
          easing: GATHER,
          fill: 'forwards',
        });
        for (const part of card.children)
          part.animate([{ opacity: 0 }], {
            duration: CARD_MS,
            easing: 'linear',
            fill: 'forwards',
          });
      }
      for (const element of document.querySelectorAll('[data-leave]'))
        element.animate([{ translate: 'calc(100vw + 4rem) 0' }], {
          duration: TITLE_MS,
          easing: GATHER,
          fill: 'forwards',
        });
      going = window.setTimeout(() => router.push(to), TILES_MS);
    };
    document.addEventListener('click', onClick, true);
    addEventListener('popstate', callOff);
    return () => {
      callOff();
      document.removeEventListener('click', onClick, true);
      removeEventListener('popstate', callOff);
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
