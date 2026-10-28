import { RefObject, useEffect, useLayoutEffect, useRef, useState } from 'react';

import { MediaSource } from '@/types';

import { Tile } from './collageLayout';
import { WIDE_FROM } from './PageScroller/edgeFade';
import { layOut } from './PostCollage';

// How much of their width a post's images must keep for its card to show
// whole on a phone.
export const KEEP = 0.97;

// Whether images laid out by `tilesAt` (the tiles in a box of a given
// height) keep at least KEEP of their widest tile's width when their box,
// `height` tall, gives up `shrink` pixels of it to the card. (Their width,
// not their area: with room to spare a picture takes a taller crop, which
// losing that room undoes at no cost to how large it shows.)
export function keepsImages(
  tilesAt: (_height: number) => readonly Tile[],
  height: number,
  shrink: number,
) {
  const widest = (h: number) =>
    Math.max(0, ...tilesAt(h).map((tile) => tile.width));
  const full = widest(height);
  return full > 0 && widest(height - shrink) >= KEEP * full;
}

type Step = 'short' | 'trying' | 'whole';

// A phone post's whole box (offsetWidth, offsetHeight): its height is
// --post-height, the room between the page's fades, so it follows the window
// and the footer (which shrinks to the scroll arrow alone, Footer/index.tsx),
// and the card leaves it alone.
type Frame = { width: number; height: number };

// Whether the card needs trying again: when the post's whole box has changed.
// Not when only its padding has: the post's bottom padding is its card's
// height (--card-height), so showing the card whole changes that, and
// re-trying on it (as a ResizeObserver's content box does) flipped the card
// between short and whole for as long as it fit (about 40 times a second).
export const frameChanged = (was: Frame | null, now: Frame) =>
  !was || was.width !== now.width || was.height !== now.height;

// Whether a phone's post with images (`isWanted`) shows its card whole, its
// technology and all its description, with no More: when its images are
// held by the window's width, so the room the whole card takes from them
// costs them (almost) nothing. Whenever the post's size changes it lays the
// card out short, as usual (a few lines, More), measures it and the
// images' box, then tries it whole and measures the card again, all before
// the page paints, and keeps it whole only if the images keep their size
// (keepsImages: their widest tile no narrower). It tries again when the
// post's whole box changes (frameChanged), not when the card changes its
// padding.
export default function usePhoneWhole(
  postRef: RefObject<HTMLElement | null>,
  mediaSources: readonly MediaSource[] | undefined,
  isWanted: boolean,
) {
  const [step, setStep] = useState<Step>('short');
  const [round, setRound] = useState(0);
  const short = useRef<{ card: number; box: number; width: number } | null>(
    null,
  );
  // The last round measured, so a card found not to fit stays short.
  const measured = useRef(0);

  useEffect(() => {
    const post = postRef.current;
    if (!post || !isWanted) return setStep('short');
    let was: Frame | null = null;
    const check = () => {
      const now = { width: post.offsetWidth, height: post.offsetHeight };
      if (!frameChanged(was, now)) return;
      was = now;
      setStep('short');
      setRound((r) => r + 1);
    };
    const resize = new ResizeObserver(check);
    resize.observe(post);
    return () => resize.disconnect();
  }, [postRef, isWanted]);

  useLayoutEffect(() => {
    const post = postRef.current;
    const card = post?.querySelector<HTMLElement>('section');
    const box = post?.querySelector<HTMLElement>('.collage');
    if (!round || !card || !box || !mediaSources || innerWidth >= WIDE_FROM)
      return;
    if (step === 'short') {
      if (measured.current === round) return;
      measured.current = round;
      short.current = {
        card: card.offsetHeight,
        box: box.offsetHeight,
        width: box.offsetWidth,
      };
      setStep('trying');
    } else if (step === 'trying' && short.current) {
      const was = short.current;
      short.current = null;
      const fits = keepsImages(
        (h) => layOut(mediaSources, was.width, h).tiles,
        was.box,
        card.offsetHeight - was.card,
      );
      setStep(fits ? 'whole' : 'short');
    }
  }, [round, step, postRef, mediaSources]);

  return isWanted && step !== 'short';
}
