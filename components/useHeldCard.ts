import { RefObject, useEffect, useState } from 'react';

// Where a post is against the one in view: above it, it (it crosses the
// window's middle line), or below it.
export type PostPlace = 'before' | 'current' | 'after';

// For a post whose card is held still while the page pages past it (Post.tsx):
// where the post is (PostPlace; below until first measured), and
// --card-height on the post, the room its card needs below its images (the
// card itself is fixed, so it takes up none).
export default function useHeldCard(ref: RefObject<HTMLElement | null>) {
  const [place, setPlace] = useState<PostPlace>('after');

  useEffect(() => {
    const post = ref.current;
    const card = post?.querySelector('section');
    if (!post || !card) return;
    const view = new IntersectionObserver(
      ([entry]) => {
        const { isIntersecting, boundingClientRect, rootBounds } = entry!;
        const middle = rootBounds?.top ?? innerHeight / 2;
        setPlace(
          isIntersecting
            ? 'current'
            : boundingClientRect.bottom <= middle
              ? 'before'
              : 'after',
        );
      },
      { rootMargin: '-50% 0px -50% 0px' },
    );
    view.observe(post);
    const resize = new ResizeObserver(() =>
      post.style.setProperty('--card-height', `${card.offsetHeight}px`),
    );
    resize.observe(card);
    return () => {
      view.disconnect();
      resize.disconnect();
    };
  }, [ref]);

  return place;
}
