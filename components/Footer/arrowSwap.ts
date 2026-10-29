import { RefObject, useEffect, useRef, useState } from 'react';

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

// The footer's look as the scroll arrow comes and goes in `slotRef` (its
// arrow slot, data-footer-arrow). While the site is still loading (its
// header and footer hidden, data-page-in not yet set) it goes straight
// to the arrow, with nothing to fade.
export function useArrowSwap(slotRef: RefObject<HTMLElement | null>) {
  const [phase, setPhase] = useState<Swap>('text');
  const phaseRef = useRef<Swap>('text');
  const [hasArrow, setHasArrow] = useState(false);

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
    if (hasArrow && !document.documentElement.hasAttribute('data-page-in'))
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
