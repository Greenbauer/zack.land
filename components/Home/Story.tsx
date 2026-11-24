'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import { lookAt } from '@/components/Background/headLook';
import { headMood } from '@/components/Background/headMood';
import { lookOrigin } from '@/components/Background/headPlace';
import type { StoryCue } from '@/components/Background/storyCue';
import Button from '@/components/Button';
import MediaMelt from '@/components/MediaMelt';
import {
  requestGlide,
  Turn,
  TURN_EVENT,
} from '@/components/PageScroller/pageGlide';
import ScrollArrows from '@/components/PageScroller/ScrollArrows';
import SnapPager from '@/components/PageScroller/SnapPager';
import Post from '@/components/Post';
import useReducedMotion from '@/hooks/useReducedMotion';

import { Chapter, CHAPTERS } from './chapters';
import NavHint from './NavHint';
import Title from './Title';
import TitleBox from './TitleBox';
import { LEAD_SECONDS, takesOver, watchDelay, watchWait } from './watch';

const INPUTS = ['wheel', 'keydown', 'touchstart', 'pointerdown'] as const;

// Where a card rests, as a look target for the head: a fixed box's offsets
// leave out the slide it is still part way through.
const cardLook = (card: HTMLElement | null) =>
  card
    ? lookAt(
        {
          x: card.offsetLeft + card.offsetWidth / 2,
          y: card.offsetTop + card.offsetHeight / 2,
        },
        { x: lookOrigin(innerWidth), y: innerHeight / 2 },
      )
    : { x: 0, y: 0 };

// Gives the head `chapter`'s cue, unless it has it already (a turn brings it,
// then its post arrives), and returns when its beats start.
function bring(chapter: Chapter, card: HTMLElement | null): number {
  const has = headMood.cue?.beats === chapter.beats ? headMood.cue : null;
  const cue: StoryCue = {
    beats: chapter.beats,
    since: has?.since ?? performance.now() / 1000 + LEAD_SECONDS,
    card: cardLook(card),
    prop: chapter.prop,
  };
  headMood.cue = cue;
  return cue.since;
}

// The home page: the name over the head, then Zack's story, one chapter per
// page turn, each a post exactly as the portfolio pages show them (Post.tsx,
// turned by SnapPager, with the scroll arrows beside them). As each arrives
// the head plays its beats and brings its prop (headMood.cue, read by the
// scene). Watch my story plays it on its own, a turn after each chapter has
// had time to be read; any wheel, key, touch or press stops it.
export default function Story() {
  const [index, setIndex] = useState(-1);
  const [since, setSince] = useState(0);
  const [isWatching, setWatching] = useState(false);
  const isStill = useReducedMotion();

  // The chapter in view, and the head's cue for it. Leaving a chapter clears
  // its cue, unless the next has already set its own.
  const onShown = useCallback(
    (chapter: Chapter, k: number, shown: boolean, card: HTMLElement | null) => {
      if (!shown) {
        if (headMood.cue?.beats === chapter.beats) headMood.cue = null;
        if (k === 0) setIndex((was) => (was === 0 ? -1 : was));
        return;
      }
      setIndex(k);
      setSince(bring(chapter, card));
    },
    [],
  );
  // A page turn brings its chapter's cue as it sets off, with everything else
  // the turn moves, rather than when its post is half way up the window.
  useEffect(() => {
    const turn = (event: Event) => {
      const { to } = (event as CustomEvent<Turn>).detail;
      const post = document.querySelectorAll('[data-post]')[to];
      const chapter = CHAPTERS[to - 1];
      if (chapter && post)
        bring(chapter, post.querySelector<HTMLElement>('section'));
      else headMood.cue = null;
    };
    addEventListener(TURN_EVENT, turn);
    return () => removeEventListener(TURN_EVENT, turn);
  }, []);
  const handlers = useMemo(
    () =>
      CHAPTERS.map(
        (chapter, k) => (shown: boolean, card: HTMLElement | null) =>
          onShown(chapter, k, shown, card),
      ),
    [onShown],
  );

  // Watch turns the page after each chapter, and stops at the end.
  const isPlaying = isWatching && watchWait(index) !== null;
  useEffect(() => {
    if (!isPlaying) return;
    const delay = watchDelay(index, since, performance.now() / 1000) ?? 0;
    const timer = setTimeout(() => requestGlide(1), delay * 1000);
    return () => clearTimeout(timer);
  }, [isPlaying, index, since]);

  // Any wheel, key, touch or press of someone's own stops it.
  useEffect(() => {
    if (!isWatching) return;
    const stop = (event: Event) => {
      if (takesOver(event.target)) setWatching(false);
    };
    for (const type of INPUTS)
      addEventListener(type, stop, { capture: true, passive: true });
    return () => {
      for (const type of INPUTS)
        removeEventListener(type, stop, { capture: true });
    };
  }, [isWatching]);

  // Leaving the page, the head goes back to its own ways.
  useEffect(
    () => () => {
      headMood.cue = null;
    },
    [],
  );

  // Watch my story: under the name on a wide screen; on a phone, in the
  // footer in place of the scroll arrow while the opening shows
  // (ScrollArrows' `lead`), so the name keeps its place under the header.
  const watch = !isStill && (
    <Button
      onClick={() => {
        setWatching(true);
        requestGlide(1);
      }}
    >
      Watch my story
    </Button>
  );

  return (
    <div className="flex w-full">
      <ScrollArrows lead={watch || undefined} />
      <div className="flex min-w-0 flex-1 flex-col gap-[var(--post-gap)]">
        <SnapPager />
        <MediaMelt />
        {/* The opening, as the page was: the name over the head. Below lg
            the head fills the middle of the screen, so the title sits at
            the top, above it; from lg it sits beside the head (TitleBox). */}
        <div
          data-post
          className="flex h-[var(--post-height)] min-h-[var(--post-height)] w-full shrink-0 snap-start scroll-mt-[var(--page-top)] items-start justify-end lg:items-center"
        >
          <TitleBox>
            <Title />
            {watch && (
              <div
                data-watch
                className="mt-6 flex justify-center max-md:hidden lg:justify-start"
              >
                {watch}
              </div>
            )}
          </TitleBox>
          {/* Left alone for a while, the opening points up at Portfolio. */}
          {index < 0 && <NavHint />}
        </div>
        {CHAPTERS.map((chapter, k) => (
          <Post
            key={chapter.id}
            content={chapter.content}
            onShown={handlers[k]}
          />
        ))}
      </div>
    </div>
  );
}
