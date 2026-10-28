import { RefObject, useEffect, useLayoutEffect, useRef, useState } from 'react';

import { PAGE_SCROLLER_ID } from './PageScroller/edgeFade';

// How long More and Less take, in milliseconds, and how long after its post
// has left the middle of the window an opened card closes again.
const OPEN_MS = 600;
const CLOSE_AWAY_MS = 900;
const SMOOTH = 'cubic-bezier(0.65, 0, 0.35, 1)';

type Phase = 'closed' | 'opening' | 'open' | 'closing';

// More and Less on a post's card (Post.tsx), moving rather than jumping.
// More: the card's top rises to the top of the post, growing it upward over
// its text, while the post's images fly up out of the window. Less: the
// card's top comes back down to just over its cut-short text while the
// images fly back in from above. Either way the post takes its new layout at
// once (an opened card lies in the post, in place of its images) and the
// motion runs from where things were: the card from its old top, the images
// held where they were, out of the layout, until they are gone. A post left
// open closes again, at once, a little after the page has moved on from it,
// so it is closed when the page comes back; a closed post above the window
// keeps what is in view still. With reduced motion it just opens and closes.
// `isExpanded` is whether the post is laid out open; `toggle` opens or
// closes it.
export default function useMoreMotion(
  postRef: RefObject<HTMLElement | null>,
  isCurrent: boolean,
) {
  const [phase, setPhase] = useState<Phase>('closed');
  // Where the card and the images were as the change began.
  const from = useRef<{ card: DOMRect; images: DOMRect | null } | null>(null);
  // The post's height and place as it was closed from away, to keep the
  // page still.
  const away = useRef<{ height: number; above: boolean } | null>(null);

  const still = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

  const toggle = () => {
    const { post, card, images } = partsOf(postRef.current);
    if (!post || !card) return;
    if (phase === 'opening' || phase === 'open') {
      // Back to the post's top first, if the page has scrolled down it.
      post.scrollIntoView({ block: 'start' });
      from.current = { card: card.getBoundingClientRect(), images: null };
      setPhase(still() ? 'closed' : 'closing');
    } else {
      from.current = {
        card: card.getBoundingClientRect(),
        images: images?.getBoundingClientRect() ?? null,
      };
      setPhase(still() ? 'open' : 'opening');
    }
  };

  useLayoutEffect(() => {
    const { post, card, images } = partsOf(postRef.current);
    const was = from.current;
    if (!post || !card || !was || (phase !== 'opening' && phase !== 'closing'))
      return;
    from.current = null;
    const timing = { duration: OPEN_MS, easing: SMOOTH };
    let motion: Animation;
    const flights: Animation[] = [];
    let release = () => {};
    if (phase === 'opening') {
      if (images && was.images) {
        // Held where they were, out of the layout, as they fly off.
        const at = post.getBoundingClientRect();
        release = hold(images, {
          position: 'absolute',
          left: `${was.images.left - at.left}px`,
          top: `${was.images.top - at.top}px`,
          width: `${was.images.width}px`,
          height: `${was.images.height}px`,
          marginLeft: '0px',
        });
        flights.push(
          images.animate(
            [
              { translate: '0 0' },
              { translate: `0 ${-was.images.bottom - 32}px` },
            ],
            // Held at the end, gone above the window, until the post drops
            // them (`open`): without it they show back in place for a frame.
            {
              duration: OPEN_MS,
              easing: 'cubic-bezier(0.32, 0, 0.67, 0)',
              fill: 'forwards',
            },
          ),
        );
      }
      // The card now lies in the post from its top (measured once the images
      // are out of the layout, or it would still sit below them); it starts
      // at its old top, the space above it given back as it rises.
      const now = card.getBoundingClientRect();
      motion = card.animate(
        [{ marginTop: `${was.card.top - now.top}px` }, { marginTop: '0px' }],
        timing,
      );
    } else {
      const now = card.getBoundingClientRect();
      // The card is fixed at the bottom again; it starts at its open top,
      // free of its usual height limit until it has come down.
      motion = card.animate(
        [
          { top: `${was.card.top}px`, maxHeight: 'none' },
          { top: `${now.top}px`, maxHeight: 'none' },
        ],
        timing,
      );
      if (images) {
        const box = images.getBoundingClientRect();
        flights.push(
          images.animate(
            [{ translate: `0 ${-box.bottom - 32}px` }, { translate: '0 0' }],
            { duration: OPEN_MS, easing: 'cubic-bezier(0.33, 1, 0.68, 1)' },
          ),
        );
      }
    }
    motion.finished.then(
      () => setPhase(phase === 'opening' ? 'open' : 'closed'),
      () => {},
    );
    return () => {
      motion.cancel();
      flights.forEach((flight) => flight.cancel());
      release();
    };
  }, [phase, postRef]);

  // Closes, at once, an opened post the page has moved on from: a moment
  // after it leaves, or, if the page comes back to it sooner, as it
  // arrives, so it is always closed when the page comes back (closeOnReturn).
  const hasLeft = useRef(false);
  useEffect(() => {
    const close = () => {
      const post = postRef.current;
      if (post) {
        const box = post.getBoundingClientRect();
        away.current = { height: box.height, above: box.bottom <= 0 };
      }
      setPhase('closed');
    };
    const now = closeOnReturn(phase !== 'closed', isCurrent, hasLeft.current);
    hasLeft.current = now.hasLeft;
    if (now.close) return close();
    if (!now.wait) return;
    const timer = setTimeout(close, CLOSE_AWAY_MS);
    return () => clearTimeout(timer);
  }, [isCurrent, phase, postRef]);

  // A post closed above the window gives back the height it lost to the
  // page's scroll, so what is in view stays put.
  useLayoutEffect(() => {
    const was = away.current;
    const post = postRef.current;
    if (phase !== 'closed' || !was || !post) return;
    away.current = null;
    const scroller = document.getElementById(PAGE_SCROLLER_ID);
    if (was.above && scroller)
      scroller.scrollTop -= was.height - post.getBoundingClientRect().height;
  }, [phase, postRef]);

  return {
    isExpanded: phase === 'opening' || phase === 'open',
    // Whether the images are gone (they stay, flying, while it opens).
    isOpen: phase === 'open',
    // Whether it is closed and still: not open, opening or closing.
    isClosed: phase === 'closed',
    toggle,
  };
}

// What an opened post (`isOpen`) does as the page moves: when it is not the
// one in view it waits CLOSE_AWAY_MS and closes (`wait`), and if it is in
// view again, having left (`hasLeft`), before that, it closes now (`close`).
export function closeOnReturn(
  isOpen: boolean,
  isCurrent: boolean,
  hasLeft: boolean,
) {
  if (!isOpen) return { hasLeft: false, close: false, wait: false };
  if (isCurrent) return { hasLeft: false, close: hasLeft, wait: false };
  return { hasLeft: true, close: false, wait: true };
}

// A post's card and its images.
const partsOf = (post: HTMLElement | null) => ({
  post,
  card: post?.querySelector<HTMLElement>('section') ?? null,
  images: post?.querySelector<HTMLElement>('.collage') ?? null,
});

// Sets `style` on `element`, giving back a function that puts back what it
// had before (React's own inline styles included).
function hold(element: HTMLElement, style: Record<string, string>) {
  const before = Object.fromEntries(
    Object.keys(style).map((key) => [
      key,
      element.style.getPropertyValue(toCss(key)),
    ]),
  );
  Object.assign(element.style, style);
  return () => {
    for (const [key, value] of Object.entries(before))
      element.style.setProperty(toCss(key), value);
  };
}

const toCss = (key: string) =>
  key.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);
