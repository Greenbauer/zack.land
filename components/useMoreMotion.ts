import { RefObject, useEffect, useLayoutEffect, useRef, useState } from 'react';

import { melt } from './MediaMelt';

// How long More and Less take, in milliseconds, and how long after its post
// has left the middle of the window an opened card closes again.
const OPEN_MS = 600;
const CLOSE_AWAY_MS = 900;
const SMOOTH = 'cubic-bezier(0.65, 0, 0.35, 1)';
// Where images that can't melt go, wholly past the window's right side.
const OFF_RIGHT = 'calc(100vw + 20rem) 0';

type Phase = 'closed' | 'opening' | 'open' | 'closing';

// More and Less on a post's card (Post.tsx), moving rather than jumping.
// More: the card's top rises to the top of the post, growing it upward over
// its text, while the post's images melt out of the window's right side
// (MediaMelt.tsx). Less: the card's top comes back down to just over its
// cut-short text while the images melt back in. Where they can't melt they
// slide off the window's right side and back. Either way the post takes its new layout at
// once (an opened card lies in the post, in place of its images) and the
// motion runs from where things were: the card from its old top, the images
// held where they were, out of the layout, until they are gone. A post left
// open closes again, at once, a little after the page has moved on from it,
// so it is closed when the page comes back (the pager keeps what is in view
// still as a post above it closes, SnapPager.tsx). With reduced motion it
// just opens and closes.
// `isExpanded` is whether the post is laid out open; `toggle` opens or
// closes it.
export default function useMoreMotion(
  postRef: RefObject<HTMLElement | null>,
  isCurrent: boolean,
) {
  const [phase, setPhase] = useState<Phase>('closed');
  // Where the card and the images were as the change began.
  const from = useRef<{ card: DOMRect; images: DOMRect | null } | null>(null);

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
        if (melts()) melt(images, -1);
        else
          flights.push(
            images.animate(
              [{ translate: '0 0' }, { translate: OFF_RIGHT }],
              // Held at the end, gone off the window, until the post drops
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
      // (Melting, the tiles come back with their box: PostCollage.tsx.)
      if (images && !melts()) {
        flights.push(
          images.animate([{ translate: OFF_RIGHT }, { translate: '0 0' }], {
            duration: OPEN_MS,
            easing: 'cubic-bezier(0.33, 1, 0.68, 1)',
          }),
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
    const close = () => setPhase('closed');
    const now = closeOnReturn(phase !== 'closed', isCurrent, hasLeft.current);
    hasLeft.current = now.hasLeft;
    if (now.close) return close();
    if (!now.wait) return;
    const timer = setTimeout(close, CLOSE_AWAY_MS);
    return () => clearTimeout(timer);
  }, [isCurrent, phase]);

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

const melts = () => document.documentElement.hasAttribute('data-melts');

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
