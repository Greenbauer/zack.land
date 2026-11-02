import { RefObject, useEffect, useRef, useState } from 'react';

import { WIDE_FROM } from '@/components/PageScroller/edgeFade';

// How long the footer's text and links take to fade out, and the arrow to
// fade in after them, in milliseconds.
export const SWAP_MS = 400;
// How long the text waits before it fades back in, in milliseconds: the
// scroll arrows' own fade as they come back over the page (ScrollArrows.tsx,
// duration-500), so the two never fade at once.
export const RETURN_WAIT_MS = 500;

// The footer's two looks on the portfolio's pages: its text and links, or,
// where the head can't fit, only the scroll arrow (Footer/index.tsx).
// `leaving`: the text fading out, the arrow not yet in; `returning`: the
// text back in the layout, unseen, about to fade in.
export type Swap = 'text' | 'leaving' | 'arrow' | 'returning';

// Where the footer goes when the arrow comes or goes (`hasArrow`): `now`, and
// `then` once `after` milliseconds have passed. Coming, the text fades out
// first and the arrow fades in only after it; going (the arrow has left the
// footer at once), the text fades back in after the arrows above have
// (`after` 0: once it is back in the layout, drawn unseen).
export function swapTo(
  phase: Swap,
  hasArrow: boolean,
): { now: Swap; then?: Swap; after?: number } {
  if (hasArrow)
    return phase === 'text' || phase === 'returning'
      ? { now: 'leaving', then: 'arrow', after: SWAP_MS }
      : { now: phase };
  return phase === 'arrow' || phase === 'leaving'
    ? { now: 'returning', then: 'text', after: 0 }
    : { now: phase };
}

// Whether the arrow coming into the footer takes its place at once, with
// nothing to fade: while the site is still loading (its header and footer
// hidden, `isPageIn` false), and on a phone the first time it comes on a
// page (`isFirstOnPage`). A phone always has it there at a page's opening,
// so its posts are laid out for the shorter footer before their images come
// in: a page that loads slowly is already in (data-page-in) by the time the
// arrow comes, and the fade put off the footer's shrinking until after the
// images had come to rest, which then jumped bigger and lower. On a wide
// screen it comes only as the head steps away, which the page shows, so it
// fades.
export const goesStraight = ({
  isPageIn,
  isPhone,
  isFirstOnPage,
}: {
  isPageIn: boolean;
  isPhone: boolean;
  isFirstOnPage: boolean;
}) => !isPageIn || (isPhone && isFirstOnPage);

// The footer's look as the scroll arrow comes and goes in `slotRef` (its
// arrow slot, data-footer-arrow) on the page at `pathname`, going straight to
// the arrow where goesStraight says so.
export function useArrowSwap(
  slotRef: RefObject<HTMLElement | null>,
  pathname: string,
) {
  const [phase, setPhase] = useState<Swap>('text');
  const phaseRef = useRef<Swap>('text');
  const [hasArrow, setHasArrow] = useState(false);
  // The page on which the arrow last came, and the page now: read as the
  // arrow comes or goes, so a page changing under a swap leaves it be.
  const arrowPageRef = useRef<string | null>(null);
  const pathnameRef = useRef(pathname);
  useEffect(() => {
    pathnameRef.current = pathname;
  }, [pathname]);

  useEffect(() => {
    const slot = slotRef.current;
    if (!slot) return;
    const look = () => setHasArrow(slot.childElementCount > 0);
    look();
    const watch = new MutationObserver(look);
    watch.observe(slot, { childList: true });
    return () => watch.disconnect();
  }, [slotRef]);

  useEffect(() => {
    const go = (next: Swap) => {
      phaseRef.current = next;
      setPhase(next);
    };
    const page = pathnameRef.current;
    const isFirstOnPage = arrowPageRef.current !== page;
    if (hasArrow) arrowPageRef.current = page;
    if (
      hasArrow &&
      goesStraight({
        isPageIn: document.documentElement.hasAttribute('data-page-in'),
        isPhone: innerWidth < WIDE_FROM,
        isFirstOnPage,
      })
    )
      return go('arrow');
    const { now, then, after } = swapTo(phaseRef.current, hasArrow);
    go(now);
    if (!then) return;
    if (after) {
      const timer = window.setTimeout(() => go(then), after);
      return () => clearTimeout(timer);
    }
    // Two frames on, once its unseen start has been drawn, or the fade has
    // nothing to start from.
    let frame = requestAnimationFrame(() => {
      frame = requestAnimationFrame(() => go(then));
    });
    return () => cancelAnimationFrame(frame);
  }, [hasArrow]);

  return phase;
}
