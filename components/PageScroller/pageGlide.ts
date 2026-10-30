// What the scroller's paging (SnapPager.tsx) shares with what drives it from
// outside the wheel and keys (ScrollArrows.tsx).

// Each post's span of scroll positions: from its top at the top of the
// page's content (--page-top) to its bottom at the bottom of the page. A post
// is one page tall (its min-height, --post-height), so both are the same,
// unless More has opened it taller (Post.tsx) and the page scrolls through it.
export function postSpans(scroller: HTMLElement): [number, number][] {
  const pageTop = parseFloat(
    getComputedStyle(scroller).getPropertyValue('--page-top'),
  );
  return [...scroller.querySelectorAll<HTMLElement>('[data-post]')].map(
    (post) => {
      const start =
        scroller.scrollTop + post.getBoundingClientRect().top - pageTop;
      const runsOn =
        post.offsetHeight - parseFloat(getComputedStyle(post).minHeight);
      return [start, start + Math.max(0, runsOn)];
    },
  );
}

// Says a turn has begun: the page is leaving for post `to` (-1 for another
// page), straight back (`quick`) if it never left. The page has not moved yet
// (MediaMelt.tsx).
export type Turn = { to: number; quick: boolean };
export const TURN_EVENT = 'page-turn';
export const announceTurn = (turn: Turn) =>
  dispatchEvent(new CustomEvent(TURN_EVENT, { detail: turn }));

// Asks the pager to glide one post down (1) or up (-1).
export const GLIDE_EVENT = 'page-glide';
export const requestGlide = (direction: 1 | -1) =>
  dispatchEvent(new CustomEvent(GLIDE_EVENT, { detail: direction }));
