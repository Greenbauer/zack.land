import { RefObject, useEffect, useState } from 'react';

import { WIDE_FROM } from './PageScroller/edgeFade';

// How far down the window a card at its top may reach, as a fraction of its
// height: above the 3D head's brows (measured at 957 by 1246, they sit at
// about 0.42), so the card covers no more than the top of the head.
export const ABOVE_BROWS = 0.4;

// Whether a card starting `top` pixels down the window and `height` tall
// ends above the head's brows on a window `windowHeight` tall.
export const endsAboveBrows = (
  top: number,
  height: number,
  windowHeight: number,
) => top + height <= ABOVE_BROWS * windowHeight;

// Whether a post with no images (`isWanted`) has its card at the top of the
// window rather than the bottom (Post.tsx): on a wide window where the card
// has no room beside the head (--head-clear is 0, useHeadClear.ts), so it
// spans the head, and only when it ends above the head's brows, so the head
// can stay centred under it. Otherwise the card stays at the bottom and the
// head moves off the window (Background/headPlace.ts).
export default function useCardOnTop(
  postRef: RefObject<HTMLElement | null>,
  isWanted: boolean,
) {
  const [isOnTop, setIsOnTop] = useState(false);
  useEffect(() => {
    const post = postRef.current;
    const card = post?.querySelector<HTMLElement>('.post-card');
    if (!post || !card || !isWanted) return setIsOnTop(false);
    const measure = () => {
      const style = getComputedStyle(post);
      const pageTop = parseFloat(style.getPropertyValue('--page-top')) || 0;
      const isCramped =
        innerWidth >= WIDE_FROM &&
        !parseFloat(style.getPropertyValue('--head-clear'));
      setIsOnTop(
        isCramped && endsAboveBrows(pageTop, card.offsetHeight, innerHeight),
      );
    };
    measure();
    const resize = new ResizeObserver(measure);
    resize.observe(post);
    resize.observe(card);
    return () => resize.disconnect();
  }, [postRef, isWanted]);
  return isOnTop;
}
