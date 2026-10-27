import { RefObject, useEffect, useState } from 'react';

// For a post whose card is held still while the page pages past it (Post.tsx):
// whether the post is the one in view (it crosses the window's middle line),
// and --card-height on the post, the room its card needs below its images
// (the card itself is fixed, so it takes up none).
export default function useHeldCard(ref: RefObject<HTMLElement | null>) {
  const [isCurrent, setIsCurrent] = useState(false);

  useEffect(() => {
    const post = ref.current;
    const card = post?.querySelector('section');
    if (!post || !card) return;
    const view = new IntersectionObserver(
      ([entry]) => setIsCurrent(entry!.isIntersecting),
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

  return isCurrent;
}
