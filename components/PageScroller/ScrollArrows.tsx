'use client';

import {
  CSSProperties,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react';
import { createPortal } from 'react-dom';

import { framedHead } from '@/components/Background/headPlace';

import { Chevrons } from './Chevrons';
import { PAGE_SCROLLER_ID, WIDE_FROM } from './edgeFade';
import { postSpans, requestGlide } from './pageGlide';

// Where the 3D head's crown and chin sit, as fractions of the window's
// height. The head is fixed in the scene, so it scales with the window's
// height alone; across, it goes wherever HeadFraming puts it (framedHead).
// Measured at 1440 by 900.
const HEAD_TOP = 0.2;
const HEAD_CHIN = 0.72;

// Each arrow and its word: 3rem of chevrons, a 0.25rem gap, a 1.25rem line
// (2rem and a 1rem line on a short window or a phone): --arrow-h, set on each.
const ARROW_HEIGHT = 'var(--arrow-h)';
// The chevrons' place and size in their box (h-12, or h-8 on a window under
// 700px tall or a phone), so their 40px slide ends at its far edge.
const CHEVRONS_UP =
  'top-11 rotate-90 scale-[0.7] [@media(max-height:700px)]:top-[29px] [@media(max-height:700px)]:scale-[0.45]';
const CHEVRONS_DOWN =
  'top-1 -rotate-90 scale-[0.7] max-md:top-[3px] max-md:scale-[0.45] [@media(max-height:700px)]:top-[3px] [@media(max-height:700px)]:scale-[0.45]';
// In a phone's footer the down arrow keeps the full size, to be easy to see
// and tap.
const CHEVRONS_DOWN_FOOTER = 'top-1 -rotate-90 scale-[0.7]';
// The header's text ends 58px down (edgeFade.ts); the footer's top edge is
// --footer-height up from the bottom (Footer). Each arrow keeps GAP from
// them, and from the head.
const HEADER_END = '58px';
const FOOTER_TOP = '(100dvh - var(--footer-height, 58px))';
const GAP = '1rem';
// The up arrow keeps further from the header, so it doesn't crowd the links.
const UP_GAP = '2rem';
const HEAD_GAP = '0.5rem';

// The up arrow sits just under the header, and the down arrow just over the
// footer, each moving in toward the other only as far as the head allows on
// a short window; the header and footer win over the head where both can't.
const UP_TOP = `max(calc(${HEADER_END} + 0.25rem), min(calc(${HEADER_END} + ${UP_GAP}), calc(${HEAD_TOP * 100}dvh - ${HEAD_GAP} - ${ARROW_HEIGHT})))`;
const DOWN_TOP = `min(calc(${FOOTER_TOP} - 0.25rem - ${ARROW_HEIGHT}), max(calc(${FOOTER_TOP} - ${GAP} - ${ARROW_HEIGHT}), calc(${HEAD_CHIN * 100}dvh + ${HEAD_GAP})))`;

// On the portfolio's pages on a wide screen: sliding chevrons (Chevrons.tsx)
// pointing up, with the word Scroll under them, just under the header and
// centred over the 3D head, and Scroll over chevrons pointing down, just
// over the footer and centred under it. Over the sky each is a pane of the
// cards' frosted glass (data-glass, drawn in the 3D scene by
// Background/glass.ts) that keeps close around it (data-glass-near), padded
// a little past the arrow, its top pulled up as far so the arrow keeps its
// place, and in the cards' text colour, which the glass keeps readable
// (--card-ink, styles/globals.css). On a phone, or
// wherever the head has stepped off the screen to leave a card the room
// (framedHead.x below 0, headPlace.ts), only the down arrow, in the footer,
// at the left of its text (data-footer-arrow, Footer) and in the footer's
// colours. Each glides to the post before or after, and shows only while
// there is a post that way. On a wide screen they sit on the body, outside
// the page's scroller, so its fade under the header doesn't hide them. They
// hide with the page while the phone menu is open (data-scroll-arrows,
// styles/globals.css).
export default function ScrollArrows() {
  const [canGo, setCanGo] = useState({ up: false, down: false });
  // The body to portal to, once on the client.
  const body = useSyncExternalStore(
    noChange,
    () => document.body,
    () => null,
  );
  const isPhone = useSyncExternalStore(
    watchPhone,
    () => innerWidth < WIDE_FROM,
    () => false,
  );
  // The footer's place for the down arrow.
  const footerSlot = useSyncExternalStore(
    noChange,
    () => document.querySelector<HTMLElement>('[data-footer-arrow]'),
    () => null,
  );
  const [isHeadAway, setIsHeadAway] = useState(false);
  const groupRef = useRef<HTMLDivElement | null>(null);

  // Where across the arrows go on a wide screen, as --arrows-x: under and
  // over the head as HeadFraming glides it; and whether it has stepped off
  // the screen.
  useEffect(() => {
    let frame = 0;
    let last = '';
    const follow = () => {
      setIsHeadAway(framedHead.x < 0);
      const x = Number.isNaN(framedHead.x) ? innerWidth / 2 : framedHead.x;
      const value = `${Math.round(x)}px`;
      if (value !== last && groupRef.current) {
        groupRef.current.style.setProperty('--arrows-x', value);
        last = value;
      }
      frame = requestAnimationFrame(follow);
    };
    frame = requestAnimationFrame(follow);
    return () => cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    const scroller = document.getElementById(PAGE_SCROLLER_ID);
    if (!scroller) return;
    const check = () => {
      const at = postSpans(scroller);
      if (!at.length) return;
      const { scrollTop } = scroller;
      const up = scrollTop > at[0]![0] + 4;
      const down = scrollTop < at[at.length - 1]![1] - 4;
      setCanGo((was) =>
        was.up === up && was.down === down ? was : { up, down },
      );
    };
    check();
    scroller.addEventListener('scroll', check, { passive: true });
    addEventListener('resize', check);
    return () => {
      scroller.removeEventListener('scroll', check);
      removeEventListener('resize', check);
    };
  }, []);

  if (footerSlot && (isPhone || isHeadAway))
    return createPortal(
      <div data-scroll-arrows>
        <ScrollArrow direction={1} isShown={canGo.down} inFooter />
      </div>,
      footerSlot,
    );
  if (!body) return null;
  return createPortal(
    <div ref={groupRef} data-scroll-arrows>
      <ScrollArrow direction={-1} isShown={canGo.up} />
      <ScrollArrow direction={1} isShown={canGo.down} />
    </div>,
    body,
  );
}

// The chevrons' place and size for an arrow pointing up or down, in the
// footer or over the sky.
const chevrons = (isUp: boolean, inFooter: boolean) => {
  if (isUp) return CHEVRONS_UP;
  return inFooter ? CHEVRONS_DOWN_FOOTER : CHEVRONS_DOWN;
};

const noChange = () => () => {};
// Calls `change` as the window crosses into or out of a phone's width.
const watchPhone = (change: () => void) => {
  const phone = matchMedia(`(max-width: ${WIDE_FROM - 0.02}px)`);
  phone.addEventListener('change', change);
  return () => phone.removeEventListener('change', change);
};

function ScrollArrow({
  direction,
  isShown,
  inFooter = false,
}: {
  direction: 1 | -1;
  isShown: boolean;
  inFooter?: boolean;
}) {
  const isUp = direction < 0;

  return (
    <button
      data-glass={inFooter ? undefined : true}
      data-glass-near={inFooter ? undefined : true}
      type="button"
      aria-label={isUp ? 'Scroll up' : 'Scroll down'}
      disabled={!isShown}
      onClick={() => requestGlide(direction)}
      style={
        inFooter
          ? undefined
          : ({ '--arrow-top': isUp ? UP_TOP : DOWN_TOP } as CSSProperties)
      }
      className={`flex items-center gap-1 transition-opacity duration-500 ${
        inFooter
          ? 'pointer-events-auto'
          : 'fixed left-[var(--arrows-x,50%)] top-[var(--arrow-top)] z-30 -mt-2 -translate-x-1/2 rounded-3xl px-4 py-2 [--arrow-h:4.5rem] [--sky-text:var(--card-ink)] [@media(max-height:700px)]:[--arrow-h:3.25rem]'
      } ${isUp ? 'flex-col' : 'flex-col-reverse'} ${
        isShown ? 'opacity-100' : 'invisible opacity-0'
      }`}
    >
      {/* The chevrons point left; turned a quarter, up or down. Shrunk, so
          their slide (the arrow-l keyframes) fits the box, ending at its far
          edge, and never reaches the header. On a short window, where the
          space over the head is tight, they and the word are smaller still;
          in a phone's footer they keep the full size. */}
      <span
        aria-hidden
        className={`relative block h-12 w-16 ${
          inFooter ? '' : 'max-md:h-8 [@media(max-height:700px)]:h-8'
        }`}
      >
        <span className={`absolute left-1/2 block ${chevrons(isUp, inFooter)}`}>
          <Chevrons />
        </span>
      </span>
      <span
        className={`font-display text-sm uppercase tracking-[0.3em] text-[color:var(--sky-text)] ${
          inFooter ? '' : 'max-md:text-xs [@media(max-height:700px)]:text-xs'
        }`}
      >
        Scroll
      </span>
    </button>
  );
}
