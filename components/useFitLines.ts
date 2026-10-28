import { RefObject, useEffect } from 'react';

// How many whole lines of text fit in `room` pixels, or null when all of it
// (`content` pixels tall) fits. Never less than one line.
export function linesThatFit(
  room: number,
  lineHeight: number,
  content: number,
) {
  if (content <= room + 1) return null;
  return Math.max(1, Math.floor((room + 1) / lineHeight));
}

// Set inline, over the box's classes (a phone's `md:line-clamp-none` resets
// overflow to visible on a wide screen).
const CLAMP = [
  'display',
  '-webkit-box-orient',
  '-webkit-line-clamp',
  'overflow',
];

// Cuts the text in `ref`'s box (a post's description, Post.tsx) after the
// last whole line its card has room for, with an ellipsis, so no line is
// cut through or faded out. The room is what the card's max height leaves
// once everything else on it is counted: the card's height less the box's
// own. A line clamp the box already has from its classes (a phone's few
// lines) stays the most it shows. While `isOn` is false the text is whole.
export default function useFitLines(
  ref: RefObject<HTMLElement | null>,
  isOn: boolean,
) {
  useEffect(() => {
    const box = ref.current;
    const card = box?.closest('section');
    if (!box || !card) return;
    const fit = () => {
      for (const name of CLAMP) box.style.removeProperty(name);
      const cap = parseFloat(getComputedStyle(card).maxHeight);
      if (!isOn || !cap) return;
      const room = cap - card.getBoundingClientRect().height + box.clientHeight;
      const line = parseFloat(
        getComputedStyle(box.querySelector('p') ?? box).lineHeight,
      );
      const lines = linesThatFit(room, line, box.scrollHeight);
      const most = parseInt(getComputedStyle(box).webkitLineClamp) || Infinity;
      if (!lines || lines >= most) return;
      box.style.setProperty('display', '-webkit-box');
      box.style.setProperty('-webkit-box-orient', 'vertical');
      box.style.setProperty('-webkit-line-clamp', `${lines}`);
      box.style.setProperty('overflow', 'hidden');
    };
    fit();
    const resize = new ResizeObserver(fit);
    resize.observe(box);
    resize.observe(card);
    return () => {
      resize.disconnect();
      for (const name of CLAMP) box.style.removeProperty(name);
    };
  }, [ref, isOn]);
}
