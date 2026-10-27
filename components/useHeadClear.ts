import { RefObject, useEffect } from 'react';

import { headRight } from './collageLayout';
import { WIDE_FROM } from './PageScroller/edgeFade';

// The space kept between the head's face and a post, and the least width a
// post needs beside it before it gives up keeping clear, in pixels.
const HEAD_GAP = 24;
const MIN_WIDTH = 560;

// Sets --head-clear on a post: how far in from its left side the 3D head's
// face reaches (plus a gap), so its images and card can both start there and
// line up. Zero on a phone, or where keeping clear would leave too little room.
export default function useHeadClear(ref: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const post = ref.current;
    if (!post) return;
    const measure = () => {
      const { left, width } = post.getBoundingClientRect();
      const reach = headRight(innerWidth, innerHeight) + HEAD_GAP - left;
      const clear =
        innerWidth >= WIDE_FROM && width - reach >= MIN_WIDTH
          ? Math.max(0, reach)
          : 0;
      post.style.setProperty('--head-clear', `${Math.round(clear)}px`);
    };
    measure();
    const resize = new ResizeObserver(measure);
    resize.observe(post);
    addEventListener('resize', measure);
    return () => {
      resize.disconnect();
      removeEventListener('resize', measure);
    };
  }, [ref]);
}
