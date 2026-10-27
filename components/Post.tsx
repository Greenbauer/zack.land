'use client';

import { useRef, useState } from 'react';
import { HiHandRaised, HiSparkles } from 'react-icons/hi2';

import Button from '@/components/Button';
import { Content } from '@/types';

import EdgeCard from './EdgeCard';
import PostCollage from './PostCollage';
import useHeadClear from './useHeadClear';
import useHeldCard from './useHeldCard';

type PostProps = { content: Content };

// A post's card leaving: it fades and sinks 12px over 0.4 seconds, then
// hides. Arriving, after a 0.7-second pause (the last card gone), it fades in
// and rises into place over 1.5 seconds, slowing gently to a stop.
const CARD_OUT =
  'opacity 0.4s ease-in, transform 0.4s ease-in, visibility 0s 0.4s';
const CARD_IN =
  'opacity 1.5s cubic-bezier(0.22, 1, 0.36, 1) 0.7s, transform 1.5s cubic-bezier(0.22, 1, 0.36, 1) 0.7s, visibility 0s 0.7s';

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
  const postRef = useRef<HTMLDivElement | null>(null);
  useHeadClear(postRef);
  const isCurrent = useHeldCard(postRef);

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
  // only the card of the post in view shows. Paging, one card fades out and
  // sinks a little, there is a pause, and the next slowly fades in and rises
  // into place (CARD_OUT, CARD_IN), while the images move with their posts.
  // The images lie behind the card, never over its text. On a wide screen
  // the card takes at most 55% of the post's height (longer text scrolls
  // inside it), so the images always keep the rest.
  return (
    <div
      ref={postRef}
      data-post
      className="relative flex h-[var(--post-height)] w-full shrink-0 snap-start scroll-mt-[var(--page-top)] flex-col justify-end"
      style={{ paddingBottom: 'var(--card-height, 0px)' }}
    >
      {hasMedia && (
        <PostCollage
          mediaSources={mediaSources}
          style={{ marginLeft: 'var(--head-clear, 0px)' }}
          className={`-mb-2 min-h-0 flex-1 md:block ${
            isExpanded ? 'hidden' : 'block'
          }`}
        />
      )}
      <EdgeCard
        style={{
          position: 'fixed',
          margin: 0,
          left: 'calc(var(--to-left, 0px) + var(--head-clear, 0px) - var(--bleed-left, 0px))',
          right: '-15rem',
          bottom: 'var(--page-bottom)',
          top: isExpanded ? 'var(--page-top)' : undefined,
          maxHeight: 'var(--card-max, var(--post-height))',
          transition: isCurrent ? CARD_IN : CARD_OUT,
        }}
        className={`z-20 w-auto max-w-none flex-col md:[--card-max:calc(var(--post-height)*0.55)] ${
          isCurrent
            ? 'opacity-100'
            : 'pointer-events-none invisible opacity-0 motion-safe:translate-y-3'
        }`}
      >
        <article
          className={`flex min-h-0 flex-col gap-3 overflow-y-auto p-5 md:flex-row md:gap-8 md:p-8 [&_p]:text-base [&_p]:leading-6 lg:[&_p]:text-lg lg:[&_p]:leading-7 [@media(max-height:800px)]:md:p-6 [@media(max-height:800px)]:[&_h2]:text-3xl [@media(max-height:800px)]:[&_p]:text-base [@media(max-height:800px)]:[&_p]:leading-6 ${
            isExpanded ? 'flex-1' : ''
          }`}
        >
          <div className="flex min-w-0 flex-col gap-3 md:flex-1 md:gap-4">
            <h2>{name}</h2>
            {!!description && (
              <div
                className={isClamped ? 'line-clamp-4 md:line-clamp-none' : ''}
              >
                {description}
              </div>
            )}
          </div>
          <div className="flex flex-col gap-3 md:w-64 md:shrink-0 md:gap-4 md:pt-2">
            {!!coded && <CodedBadge coded={coded} />}
            {!!technology && (
              <p className={isClamped ? 'hidden md:block' : ''}>
                Technology used:
                <br />
                <small>{technology}</small>
              </p>
            )}
            {hasMedia && (
              <button
                type="button"
                className="self-start text-sm uppercase tracking-wider text-[color:var(--card-ink)] underline decoration-[color:var(--card-underline)] underline-offset-4 transition-[text-decoration-color] hover:decoration-[color:var(--card-accent)] md:hidden"
                onClick={() => setIsExpanded(!isExpanded)}
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
