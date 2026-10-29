import { RefObject, useEffect } from 'react';

// The least height a post's card can take and still show its two columns
// whole, as --card-floor on the card: its own edges, the article's padding
// and the taller of its column of links (`linksRef`: its badge, technology
// and buttons) and its column of text with one line of its description
// (`descriptionRef`: the title, that line and More). Each is measured at its
// own height, never the card's (Post.tsx keeps the links from stretching to
// it), so the floor follows them and not the card's last size. The card is
// capped at 55% of the post's height on a wide screen (Post.tsx), and never
// below this, so on a short window a button is never cut by the card's
// bottom edge and the description always shows a line; the rest of the text
// is cut to fit (FitText).
export default function useCardFloor(
  articleRef: RefObject<HTMLElement | null>,
  linksRef: RefObject<HTMLElement | null>,
  descriptionRef: RefObject<HTMLElement | null>,
) {
  useEffect(() => {
    const article = articleRef.current;
    const links = linksRef.current;
    const card = article?.parentElement;
    if (!article || !links || !card) return;
    const description = descriptionRef.current;
    const text = description?.parentElement;
    // The text column with its description cut to one line.
    const textHeight = () => {
      if (!description || !text) return 0;
      const parts = [...text.children] as HTMLElement[];
      const gap = parseFloat(getComputedStyle(text).rowGap) || 0;
      const line = parseFloat(
        getComputedStyle(description.querySelector('p') ?? description)
          .lineHeight,
      );
      return parts.reduce(
        (sum, part, k) =>
          sum +
          (part === description ? line : part.offsetHeight) +
          (k ? gap : 0),
        0,
      );
    };
    const measure = () => {
      const { paddingTop, paddingBottom } = getComputedStyle(article);
      const edges = card.offsetHeight - article.offsetHeight;
      const floor =
        edges +
        parseFloat(paddingTop) +
        parseFloat(paddingBottom) +
        Math.max(links.offsetHeight, textHeight());
      card.style.setProperty('--card-floor', `${floor}px`);
    };
    measure();
    const resize = new ResizeObserver(measure);
    resize.observe(links);
    resize.observe(card);
    if (text) resize.observe(text);
    return () => resize.disconnect();
  }, [articleRef, linksRef, descriptionRef]);
}
