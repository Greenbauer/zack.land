// A page turned by a key or a scroll arrow (SnapPager.tsx) moves keyboard
// focus to the arriving post's title and says where the page is, politely,
// for a screen reader: "Smart Bed, 2 of 4". A turn by the wheel or a swipe
// does neither, so a mouse or a finger keeps what it had.

// The words a screen reader hears on arriving at post `index` (from 0) of
// `count`.
export const turnMessage = (name: string, index: number, count: number) =>
  `${name}, ${index + 1} of ${count}`;

// The polite status region SnapPager renders, and the posts' titles.
export const ARRIVAL_REGION_ID = 'page-turn-status';
export const POST_TITLE = '[data-post-title]';

// How long to keep trying to focus the title, in milliseconds: an arriving
// card shows at once, or 0.7 seconds later with reduced motion (Post.tsx).
const FOCUS_WITHIN_MS = 1500;

export function arrive(scroller: HTMLElement, index: number) {
  const posts = scroller.querySelectorAll('[data-post]');
  const title = posts[index]?.querySelector<HTMLElement>(POST_TITLE);
  if (!title) return;
  const region = document.getElementById(ARRIVAL_REGION_ID);
  if (region)
    region.textContent = turnMessage(
      title.textContent ?? '',
      index,
      posts.length,
    );
  const until = performance.now() + FOCUS_WITHIN_MS;
  const focus = () => {
    if (getComputedStyle(title).visibility === 'visible')
      title.focus({ preventScroll: true });
    else if (performance.now() < until) requestAnimationFrame(focus);
  };
  focus();
}
