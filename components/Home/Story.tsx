'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import { headMood } from '@/components/Background/headMood';
import { requestGlide } from '@/components/PageScroller/pageGlide';
import SnapPager from '@/components/PageScroller/SnapPager';
import { PostPlace } from '@/components/useHeldCard';

import Bubble from './Bubble';
import ChapterPost from './ChapterPost';
import { CHAPTERS } from './chapters';
import NavHint from './NavHint';
import StoryControls from './StoryControls';
import { StoryContext } from './storyState';
import Title from './Title';
import TitleBox from './TitleBox';
import { takesOver, watchWait } from './watch';

const INPUTS = ['wheel', 'keydown', 'touchstart', 'pointerdown'] as const;

// The home page: the name over the head, then Zack's story, one chapter per
// page turn (SnapPager, as the portfolio's posts), each told by the head in
// a line or three over it (Bubble) while its card names it (ChapterPost).
// Watch plays it on its own; Chapters jumps to one (StoryControls).
export default function Story() {
  const [index, setIndex] = useState(-1);
  const [since, setSince] = useState(0);
  const [isWatching, setWatching] = useState(false);

  // The chapter in view, from where each chapter's post is: the one in view
  // says so, and the first saying the view is above it means the opening.
  const onPlace = useCallback(
    (chapter: number, place: PostPlace, startsAt: number) => {
      if (place === 'current') {
        setIndex(chapter);
        setSince(startsAt);
      } else if (chapter === 0 && place === 'after') setIndex(-1);
    },
    [],
  );

  // Watch turns the page after each chapter's lines, and stops at the end.
  const wait = watchWait(index);
  const isPlaying = isWatching && wait !== null;
  useEffect(() => {
    if (!isPlaying || wait === null) return;
    const timer = setTimeout(() => requestGlide(1), wait * 1000);
    return () => clearTimeout(timer);
  }, [isPlaying, wait, since]);

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

  // While a chapter shows, a phone's footer drops its line of text, so the
  // chapter's card sits low enough to leave the head's face in view
  // (data-story-chapter, styles/globals.css).
  useEffect(() => {
    const root = document.documentElement;
    if (index >= 0) root.dataset.storyChapter = '';
    else delete root.dataset.storyChapter;
    return () => {
      delete root.dataset.storyChapter;
    };
  }, [index]);

  // Leaving the page, the head goes back to its own ways.
  useEffect(
    () => () => {
      headMood.cue = null;
    },
    [],
  );

  const state = useMemo(
    () => ({ index, since, isWatching: isPlaying, setWatching }),
    [index, since, isPlaying],
  );

  return (
    <StoryContext value={state}>
      <div className="flex w-full min-w-0 flex-col gap-[var(--post-gap)]">
        <SnapPager />
        {/* The opening, as the page was: the name over the head. Below lg
            the head fills the middle of the screen, so the title sits at
            the top, above it; from lg it sits beside the head (TitleBox). */}
        <div
          data-post
          className="flex h-[var(--post-height)] min-h-[var(--post-height)] w-full shrink-0 snap-start scroll-mt-[var(--page-top)] items-start justify-end lg:items-center"
        >
          <TitleBox>
            <Title />
            <StoryControls isOpening />
          </TitleBox>
          {/* Left alone for a while, the opening points up at Portfolio. */}
          {index < 0 && <NavHint />}
        </div>
        {CHAPTERS.map((chapter, k) => (
          <ChapterPost
            key={chapter.id}
            chapter={chapter}
            index={k}
            onPlace={onPlace}
          />
        ))}
      </div>
      <Bubble />
    </StoryContext>
  );
}
