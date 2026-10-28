'use client';

import { useRef, useState } from 'react';
import { HiHandRaised, HiSparkles } from 'react-icons/hi2';

import Button from '@/components/Button';
import { Content } from '@/types';

import EdgeCard from './EdgeCard';
import PostCollage from './PostCollage';
import useClipped from './useClipped';
import useHeadClear from './useHeadClear';
import useHeldCard, { PostPlace } from './useHeldCard';

type PostProps = { content: Content };

// Where a post's card waits, by where its post is (PostPlace): in place for
// the post in view, wholly off the window's right side for posts above it
// and off its left side for posts below (a window's width and 20rem: its
// glass reaches 15rem past the window's edge, and the glass over photos 64px
// past that, photoLens.ts). Paging down, a card slides out to the right
// and the next comes in from the left; paging up, the other way. They are
// transitions, so a card turned back part way reverses from where it is.
// Leaving, it gathers speed off the window's edge (0.8 seconds) and then
// hides; arriving, after a pause for the last to leave (--turn-delay, 0.7
// seconds unless a quick turn back sets it to 0, SnapPager.tsx), it slows
// gently into place (1.4 seconds). Its glass stays whole; only what is on it
// fades, in from a quarter of a second into the slide and out by the time it
// leaves. With reduced motion the card just shows or hides, and what is on it
// fades.
// Arriving slows gently to a stop, cubic-bezier(0.22,1,0.36,1); leaving
// gathers speed, cubic-bezier(0.32,0,0.67,0). (Written out whole, as
// Tailwind only finds class names it can read in full.)
const LEAVING =
  'pointer-events-none invisible motion-safe:[transition:translate_0.8s_cubic-bezier(0.32,0,0.67,0),visibility_0s_0.8s] motion-reduce:[transition:visibility_0s_0.4s]';
const CARD: Record<PostPlace, string> = {
  current:
    'motion-safe:[transition:translate_1.4s_cubic-bezier(0.22,1,0.36,1)_var(--turn-delay,0.7s),visibility_0s] motion-reduce:[transition:visibility_0s_0.7s]',
  before: `motion-safe:[translate:calc(100vw+20rem)_0] ${LEAVING}`,
  after: `motion-safe:[translate:calc(-100vw-20rem)_0] ${LEAVING}`,
};
const CONTENT_IN =
  'motion-safe:[transition:opacity_1.2s_cubic-bezier(0.22,1,0.36,1)_calc(var(--turn-delay,0.7s)+0.25s)] motion-reduce:[transition:opacity_1.2s_ease-out_0.7s]';
const CONTENT_OUT =
  'opacity-0 [transition:opacity_0.65s_cubic-bezier(0.32,0,0.67,0)] motion-reduce:[transition:opacity_0.4s_ease-in]';

export default function Post({ content }: PostProps) {
  const {
    name,
    mediaSources,
    description,
    technology,
    coded,
    siteUrl,
    repositoryUrl,
  } = content;

  const [isExpanded, setIsExpanded] = useState(false);
  const hasMedia = !!mediaSources?.length;
  // On a phone a post with images shows a few lines of its text and hides the
  // rest behind More, which gives the whole post to the text.
  const isClamped = hasMedia && !isExpanded;
  // The card never scrolls inside: on any screen, text that doesn't fit is
  // cut short (faded out at the bottom on a wide screen) and More shows.
  // Opened, the card takes the whole post in place of its images, and if
  // that is still too short the post grows and the page scrolls through it
  // (SnapPager.tsx).
  const articleRef = useRef<HTMLElement | null>(null);
  const descriptionRef = useRef<HTMLDivElement | null>(null);
  const isArticleCut = useClipped(articleRef);
  const isDescriptionCut = useClipped(descriptionRef);
  const isCut = !isExpanded && (isArticleCut || isDescriptionCut);
  const hasMore = isExpanded || isCut;
  const postRef = useRef<HTMLDivElement | null>(null);
  useHeadClear(postRef);
  const place = useHeldCard(postRef);
  const isCurrent = place === 'current';

  // Each post fills the space between the page's fades (--post-height, from
  // PageScroller), and the page snaps from post to post (data-post, found by
  // SnapPager). Its images are separate tiles (PostCollage) above its
  // frosted card, which spans the bottom: wide and short, its title and
  // description beside its technology and links on a wide screen, and only
  // as tall as its text. On a wide screen both start just right of the 3D
  // head's face (--head-clear, from useHeadClear), so the card lines up with
  // the space its photos keep to; its glass runs out past the window's right
  // side, and on a phone both sides (EdgeCard).
  //
  // The card doesn't scroll: it is fixed where it rests, at the bottom of the
  // space between the fades (the post keeps room for it, --card-height), and
  // only the card of the post in view shows. Paging, one card slides off
  // and, after a pause, the next slides in (CARD), each card's text fading
  // as it goes, while the images move with their posts.
  // The images lie behind the card, never over its text. On a wide screen
  // the card takes at most 55% of the post's height, so the images always
  // keep the rest; longer text is cut short until More opens the card: then
  // it is no longer fixed but lies in the post, which it fills in place of
  // the images, at least a page tall and taller if its text needs.
  return (
    <div
      ref={postRef}
      data-post
      className={`relative flex min-h-[var(--post-height)] w-full shrink-0 snap-start scroll-mt-[var(--page-top)] flex-col ${
        isExpanded ? '' : 'h-[var(--post-height)] justify-end'
      }`}
      style={{
        paddingBottom: isExpanded ? undefined : 'var(--card-height, 0px)',
      }}
    >
      {hasMedia && (
        <PostCollage
          mediaSources={mediaSources}
          style={{ marginLeft: 'var(--head-clear, 0px)' }}
          className={`-mb-2 min-h-0 flex-1 ${isExpanded ? 'hidden' : 'block'}`}
        />
      )}
      <EdgeCard
        style={
          isExpanded
            ? { position: 'relative' }
            : {
                position: 'fixed',
                // Longhands, as EdgeCard sets: React clearing a `margin`
                // shorthand on More would clear EdgeCard's margins too.
                marginLeft: 0,
                marginRight: 0,
                left: 'calc(var(--to-left, 0px) + var(--head-clear, 0px) - var(--bleed-left, 0px))',
                right: '-15rem',
                bottom: 'var(--page-bottom)',
                maxHeight: 'var(--card-max, var(--post-height))',
              }
        }
        className={`z-20 flex w-auto max-w-none flex-col md:[--card-max:calc(var(--post-height)*0.55)] ${
          isExpanded ? 'flex-1' : ''
        } ${CARD[place]}`}
      >
        <article
          ref={articleRef}
          className={`flex min-h-0 flex-col gap-3 overflow-hidden p-5 md:flex-row md:gap-8 md:p-8 [&_p]:text-base [&_p]:leading-6 lg:[&_p]:text-lg lg:[&_p]:leading-7 [@media(max-height:800px)]:md:p-6 [@media(max-height:800px)]:[&_h2]:text-3xl [@media(max-height:800px)]:[&_p]:text-base [@media(max-height:800px)]:[&_p]:leading-6 ${
            isExpanded ? 'flex-1' : ''
          } ${isCurrent ? CONTENT_IN : CONTENT_OUT}`}
        >
          <div className="flex min-h-0 min-w-0 flex-col gap-3 md:flex-1 md:gap-4">
            <h2>{name}</h2>
            {!!description && (
              <div
                ref={descriptionRef}
                className={`min-h-0 overflow-hidden ${
                  isClamped ? 'line-clamp-4 md:line-clamp-none' : ''
                } ${
                  isCut
                    ? 'md:[mask-image:linear-gradient(to_bottom,black_calc(100%-2rem),transparent)]'
                    : ''
                }`}
              >
                {description}
              </div>
            )}
          </div>
          <div className="flex shrink-0 flex-col gap-3 md:w-64 md:gap-4 md:pt-2">
            {!!coded && <CodedBadge coded={coded} />}
            {!!technology && (
              <p className={isClamped ? 'hidden md:block' : ''}>
                Technology used:
                <br />
                <small>{technology}</small>
              </p>
            )}
            {(hasMedia || hasMore) && (
              <button
                type="button"
                className={`self-start text-sm uppercase tracking-wider text-[color:var(--card-ink)] underline decoration-[color:var(--card-underline)] underline-offset-4 transition-[text-decoration-color] hover:decoration-[color:var(--card-accent)] ${
                  hasMore ? '' : 'md:hidden'
                }`}
                onClick={() => {
                  setIsExpanded(!isExpanded);
                  // Closing a post the page has scrolled down through goes
                  // back to its top.
                  if (isExpanded)
                    requestAnimationFrame(() =>
                      postRef.current?.scrollIntoView({ block: 'start' }),
                    );
                }}
                aria-expanded={isExpanded}
              >
                {isExpanded ? 'Less' : 'More'}
              </button>
            )}
            {!!siteUrl && (
              <Button href={siteUrl} target="_blank">
                Visit Site
              </Button>
            )}
            {!!repositoryUrl && (
              <Button href={repositoryUrl} target="_blank">
                View Code
              </Button>
            )}
          </div>
        </article>
      </EdgeCard>
    </div>
  );
}

// How a site was built, as a small pill above its technology, in the card's
// ink (the only colour its glass keeps readable): hand coded, with a raised
// hand in the card's accent on a wash of it; vibe coded, with the sparkles AI
// tools mark themselves with, on a wash of the ink.
function CodedBadge({ coded }: { coded: 'hand' | 'vibe' }) {
  const isHand = coded === 'hand';
  const Icon = isHand ? HiHandRaised : HiSparkles;
  return (
    <span
      className={`inline-flex items-center gap-2 self-start rounded-full px-3 py-1 font-display text-xs uppercase tracking-widest text-[color:var(--card-ink)] ${
        isHand
          ? 'bg-[color-mix(in_srgb,var(--card-accent)_15%,transparent)]'
          : 'bg-[color-mix(in_srgb,var(--card-ink)_10%,transparent)]'
      }`}
    >
      <Icon
        aria-hidden
        className={`size-3.5 ${isHand ? 'text-[color:var(--card-accent)]' : ''}`}
      />
      {isHand ? 'Hand Coded' : 'Vibe Coded'}
    </span>
  );
}
