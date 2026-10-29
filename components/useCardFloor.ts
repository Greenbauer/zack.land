import { RefObject, useEffect, useState } from 'react';

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
// is cut to fit (FitText). True when, on a wide screen, the post is too
// short for even that floor, as a phone on its side is: the post then lays
// its card out open (Post.tsx).
// The least height a post's photos are kept to above its card: under it
// they are only a strip (about 50 pixels at 900 by 560), so the card is laid
// out open instead.
export const MIN_PHOTOS_PX = 64;

// Whether a post `post` pixels tall is too short for a card whose floor is
// `floor`, with the room its photos need above it when it has any.
export const isTooShortFor = (
  floor: number,
  post: number,
  hasPhotos: boolean,
) => floor + (hasPhotos ? MIN_PHOTOS_PX : 0) > post + 1;

export default function useCardFloor(
  articleRef: RefObject<HTMLElement | null>,
  linksRef: RefObject<HTMLElement | null>,
  descriptionRef: RefObject<HTMLElement | null>,
  hasPhotos: boolean,
) {
  const [isTooShort, setIsTooShort] = useState(false);
  useEffect(() => {
    const article = articleRef.current;
    const links = linksRef.current;
    const card = article?.parentElement;
    const post = card?.parentElement;
    if (!article || !links || !card || !post) return;
    const wide = matchMedia('(min-width: 768px)');
    // The post's height between the page's fades, whatever its own is now.
    const postHeight = () => {
      const probe = document.createElement('div');
      probe.style.cssText =
        'position:absolute;visibility:hidden;height:var(--post-height)';
      post.append(probe);
      const height = probe.offsetHeight;
      probe.remove();
      return height;
    };
    const description = descriptionRef.current;
    const text = description?.parentElement;
    // The height of the text column's More, kept from when it last showed
    // (a wide card's More is about 20 pixels).
    let moreHeight = 20;
    // The text column with its description cut to one line, and always with
    // room for More: a card is closed only where More then fits, so laying
    // it open (which takes More away) must not lower its floor, or it would
    // close again and bring More back.
    const textHeight = () => {
      if (!description || !text) return 0;
      // Its shown parts: on a phone its More is hidden (it sits with the
      // links there).
      const parts = ([...text.children] as HTMLElement[]).filter(
        (part) => part === description || part.offsetHeight > 0,
      );
      const gap = parseFloat(getComputedStyle(text).rowGap) || 0;
      const line = parseFloat(
        getComputedStyle(description.querySelector('p') ?? description)
          .lineHeight,
      );
      const more = parts.find((part) => part.tagName === 'BUTTON');
      if (more) moreHeight = more.offsetHeight;
      const shown = parts.reduce(
        (sum, part, k) =>
          sum +
          (part === description ? line : part.offsetHeight) +
          (k ? gap : 0),
        0,
      );
      return more ? shown : shown + gap + moreHeight;
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
      setIsTooShort(
        wide.matches && isTooShortFor(floor, postHeight(), hasPhotos),
      );
    };
    measure();
    // Measured again a frame after anything changes, once every other
    // watcher has run: the footer's height reaches --post-height through
    // the footer's own watcher (Footer/index.tsx), which may run after this
    // one.
    let frame = 0;
    const remeasure = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(measure);
    };
    const resize = new ResizeObserver(remeasure);
    resize.observe(links);
    resize.observe(card);
    // The post too: its height between the page's fades settles after the
    // first measure (the footer's own height comes later), and a card held
    // at its floor does not change with it. And the footer itself, whose
    // height that is: a post laid open taller than the window does not
    // change size when it does.
    resize.observe(post);
    const footer = document.querySelector('footer');
    if (footer) resize.observe(footer);
    // The text column stretches to the card, so its own size does not
    // change as its title wraps or More comes and goes: each of its parts
    // is watched instead, and so is which parts it has.
    const watchText = () => {
      for (const part of text?.children ?? []) resize.observe(part);
    };
    watchText();
    const parts = new MutationObserver(() => {
      watchText();
      remeasure();
    });
    if (text) parts.observe(text, { childList: true });
    addEventListener('resize', remeasure);
    return () => {
      cancelAnimationFrame(frame);
      resize.disconnect();
      parts.disconnect();
      removeEventListener('resize', remeasure);
    };
  }, [articleRef, linksRef, descriptionRef, hasPhotos]);

  return isTooShort;
}
