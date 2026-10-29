import { RefObject, useEffect } from 'react';

// The least height a post's card can take and still show its column of
// links (`linksRef`: its badge, technology and buttons) whole, as
// --card-floor on the card: its own edges, the article's padding and that
// column, at its own height (Post.tsx keeps it from stretching to the
// card's, which would hold the floor at whatever the card last was). The
// card is capped at 55% of the post's height on a wide screen (Post.tsx),
// and never below this, so on a short window a button is never cut by the
// card's bottom edge; its text is cut to fit instead (FitText).
export default function useCardFloor(
  articleRef: RefObject<HTMLElement | null>,
  linksRef: RefObject<HTMLElement | null>,
) {
  useEffect(() => {
    const article = articleRef.current;
    const links = linksRef.current;
    const card = article?.parentElement;
    if (!article || !links || !card) return;
    const measure = () => {
      const { paddingTop, paddingBottom } = getComputedStyle(article);
      const edges = card.offsetHeight - article.offsetHeight;
      const floor =
        edges +
        parseFloat(paddingTop) +
        parseFloat(paddingBottom) +
        links.offsetHeight;
      card.style.setProperty('--card-floor', `${floor}px`);
    };
    measure();
    const resize = new ResizeObserver(measure);
    resize.observe(links);
    resize.observe(card);
    return () => resize.disconnect();
  }, [articleRef, linksRef]);
}
