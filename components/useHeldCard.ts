import { RefObject, useEffect, useState } from 'react';

// Where a post is against the one in view: above it, it (it crosses the
// line through the middle of the space between the page's fades), or below
// it.
export type PostPlace = 'before' | 'current' | 'after';

// How far down the window the line a post must cross to be the one in view
// lies: the middle of the space between the page's fades, which starts at
// `pageTop` (--page-top) and is `postHeight` tall (--post-height, a post's
// min-height). A post at rest always covers that space, at its top or, laid
// open taller than the page, at its end, so it always crosses the line. The
// window's middle is not always in the space: the fade at the bottom can run
// deeper than the one at the top (it follows the footer's height), and on a
// phone on its side the space runs from 160 to 192 pixels down a window 390
// tall, so at the end of a tall post no post crossed the window's middle and
// every card hid.
export const viewLine = (pageTop: number, postHeight: number) =>
  pageTop + postHeight / 2;

// Where a post is, from what the observer brings of it crossing the line
// `line` pixels down the window. A busy page can bring several crossings at
// once, in order, and the last is where it is now: read the first, a post
// the page had only wobbled across kept its old place, and its card hid.
export function placeOf(
  entries: readonly Pick<
    IntersectionObserverEntry,
    'isIntersecting' | 'boundingClientRect'
  >[],
  line: number,
): PostPlace {
  const { isIntersecting, boundingClientRect } = entries.at(-1)!;
  if (isIntersecting) return 'current';
  return boundingClientRect.bottom <= line ? 'before' : 'after';
}

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
    // The line moves when the window's height or the footer's does
    // (--footer-height, which the footer sets on the root element), so the
    // observer is made again then.
    let view: IntersectionObserver | undefined;
    let line = 0;
    let margin = '';
    const watch = () => {
      const style = getComputedStyle(post);
      line = viewLine(
        parseFloat(style.getPropertyValue('--page-top')) || 0,
        parseFloat(style.minHeight) || 0,
      );
      // A band a pixel deep from the line down, measured against the
      // viewport the observer uses (the root element's height; innerHeight
      // also counts a scrollbar): a band with no depth leaves no slack, and
      // a root even a little shorter than measured has nothing to cross, so
      // every card hides.
      const at = `${-line}px 0px ${line + 1 - document.documentElement.clientHeight}px 0px`;
      if (at === margin) return;
      margin = at;
      view?.disconnect();
      view = new IntersectionObserver(
        (entries) => setPlace(placeOf(entries, line)),
        { rootMargin: margin },
      );
      view.observe(post);
    };
    watch();
    addEventListener('resize', watch);
    const footer = new MutationObserver(watch);
    footer.observe(document.documentElement, { attributeFilter: ['style'] });
    const resize = new ResizeObserver(() =>
      post.style.setProperty('--card-height', `${card.offsetHeight}px`),
    );
    resize.observe(card);
    return () => {
      view?.disconnect();
      removeEventListener('resize', watch);
      footer.disconnect();
      resize.disconnect();
    };
  }, [ref]);

  return place;
}
