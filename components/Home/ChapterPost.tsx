'use client';

import Image from 'next/image';
import { CSSProperties, useEffect, useRef, useSyncExternalStore } from 'react';

import { lookAt } from '@/components/Background/headLook';
import { headMood } from '@/components/Background/headMood';
import { lookOrigin } from '@/components/Background/headPlace';
import type { StoryCue } from '@/components/Background/storyCue';
import Button from '@/components/Button';
import EdgeCard from '@/components/EdgeCard';
import { WIDE_FROM } from '@/components/PageScroller/edgeFade';
import { CARD, CONTENT_IN, CONTENT_OUT } from '@/components/Post';
import useHeldCard, { PostPlace } from '@/components/useHeldCard';

import { Chapter } from './chapters';
import StoryControls from './StoryControls';
import { LEAD_SECONDS } from './watch';

// Whether the window is wide (WIDE_FROM up), where the head makes room for
// a chapter's card and sits beside it; on a phone it stays in view, the card
// over its chest (EdgeCard isAboveHead, which also keeps the card's text
// light, over the dark head).
const WIDE = `(min-width: ${WIDE_FROM}px)`;
const watchWidth = (change: () => void) => {
  const query = matchMedia(WIDE);
  query.addEventListener('change', change);
  return () => query.removeEventListener('change', change);
};
const useIsWide = () =>
  useSyncExternalStore(
    watchWidth,
    () => matchMedia(WIDE).matches,
    () => true,
  );

// Where a chapter's card rests: fixed at the bottom of the space between the
// page's fades, as a post's card is (Post.tsx cardStyle). On a wide screen it
// takes the right 55% of the content's frame, leaving the head the rest; on
// a phone the whole width, its glass running past both sides (EdgeCard).
const CARD_STYLE: CSSProperties = {
  position: 'fixed',
  marginLeft: 0,
  marginRight: 0,
  left: 'calc(var(--to-left, 0px) + var(--chapter-inset, 0px) - var(--bleed-left, 0px))',
  right: 'calc(var(--to-right, 0px) - var(--bleed-right, 0px))',
  bottom: 'var(--page-bottom)',
};

const isOutside = (href: string) => /^https?:/.test(href);

// One chapter of the home page's story (chapters.ts): a page-tall post the
// pager turns to, and its card, which slides in and out as a portfolio
// post's does (Post.tsx CARD). Arriving, it tells the story (`onPlace`) and
// asks the head for the chapter's beats (storyCue.ts), looking at the card.
export default function ChapterPost({
  chapter,
  index,
  onPlace,
}: {
  chapter: Chapter;
  index: number;
  onPlace: (_index: number, _place: PostPlace, _since: number) => void;
}) {
  const { part, title, detail, lines, photo, link, beats } = chapter;
  const postRef = useRef<HTMLDivElement | null>(null);
  const cardRef = useRef<HTMLElement | null>(null);
  const place = useHeldCard(postRef, cardRef);
  const isCurrent = place === 'current';
  const isWide = useIsWide();

  useEffect(() => {
    const since = performance.now() / 1000 + LEAD_SECONDS;
    onPlace(index, place, since);
    const card = cardRef.current;
    if (!isCurrent || !card) return;
    // Where the card rests (a fixed box's offsets leave out the slide it is
    // part way through), as a look target for the head.
    const at = {
      x: card.offsetLeft + card.offsetWidth / 2,
      y: card.offsetTop + card.offsetHeight / 2,
    };
    const cue: StoryCue = {
      beats,
      since,
      card: lookAt(at, { x: lookOrigin(innerWidth), y: innerHeight / 2 }),
    };
    headMood.cue = cue;
    return () => {
      if (headMood.cue === cue) headMood.cue = null;
    };
  }, [index, place, isCurrent, beats, onPlace]);

  return (
    <div
      ref={postRef}
      data-post
      data-chapter={chapter.id}
      className="relative flex h-[var(--post-height)] min-h-[var(--post-height)] w-full shrink-0 snap-start scroll-mt-[var(--page-top)] flex-col justify-end"
    >
      <EdgeCard
        ref={cardRef}
        isAboveHead={!isWide}
        isOffView={!isCurrent}
        style={CARD_STYLE}
        className={`z-20 flex w-auto max-w-none md:[--chapter-inset:calc((100vw-var(--to-left,0px)-var(--to-right,0px))*0.45)] ${CARD[place]}`}
      >
        <article
          className={`flex w-full flex-col gap-3 px-5 py-4 md:p-8 ${isCurrent ? CONTENT_IN : CONTENT_OUT}`}
        >
          <div className="flex items-center gap-4 md:gap-6">
            {photo && (
              <Image
                src={photo.src}
                alt={photo.alt}
                width={176}
                height={112}
                sizes="(min-width: 768px) 176px, 96px"
                className="h-12 w-16 shrink-0 rounded-lg object-cover md:h-28 md:w-44 md:rounded-xl"
              />
            )}
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <p className="text-xs uppercase tracking-widest">{part}</p>
              {/* Focused by a page turn from a key (PageScroller/arrival.ts). */}
              <h2
                data-post-title
                tabIndex={-1}
                className="rounded-md text-lg outline-none outline-offset-4 focus-visible:outline-[color:var(--card-ink)] md:text-3xl"
              >
                {title}
              </h2>
              {detail && <p className="text-base max-md:hidden">{detail}</p>}
              {/* What the head says, for screen readers (Bubble is
                  hidden from them). */}
              <p className="sr-only">{lines.join(' ')}</p>
            </div>
            {link && (
              <Button
                href={link.href}
                target={isOutside(link.href) ? '_blank' : undefined}
                className="shrink-0 max-md:hidden"
              >
                {link.label}
              </Button>
            )}
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <StoryControls />
            {link && (
              <Button
                href={link.href}
                target={isOutside(link.href) ? '_blank' : undefined}
                className="!px-4 !py-1.5 !text-base md:hidden"
              >
                {link.label}
              </Button>
            )}
          </div>
        </article>
      </EdgeCard>
    </div>
  );
}
