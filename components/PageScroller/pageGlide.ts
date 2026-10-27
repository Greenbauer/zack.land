// What the scroller's paging (SnapPager.tsx) shares with what drives it from
// outside the wheel and keys (ScrollArrows.tsx).

// Each post's scroll position in the scroller: its top at the top of the
// page's content (--page-top).
export function postPositions(scroller: HTMLElement): number[] {
  const pageTop = parseFloat(
    getComputedStyle(scroller).getPropertyValue('--page-top'),
  );
  return [...scroller.querySelectorAll('[data-post]')].map(
    (post) => scroller.scrollTop + post.getBoundingClientRect().top - pageTop,
  );
}

// Asks the pager to glide one post down (1) or up (-1).
export const GLIDE_EVENT = 'page-glide';
export const requestGlide = (direction: 1 | -1) =>
  dispatchEvent(new CustomEvent(GLIDE_EVENT, { detail: direction }));
