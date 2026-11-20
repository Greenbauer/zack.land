'use client';

import { useEffect, useRef, useState } from 'react';

import { framedHead } from '@/components/Background/headPlace';
import useReducedMotion from '@/hooks/useReducedMotion';

import { CHAPTERS, shownLine } from './chapters';
import { useStory } from './storyState';

// Where the 3D head's crown sits, as a fraction of the window's height (the
// head scales with the window's height alone: PageScroller/ScrollArrows.tsx).
const HEAD_TOP = 0.2;

// What the head says, over its crown, following it across as the page moves
// it (framedHead): the chapter's lines, one at a time. With reduced motion,
// all of them at once. Hidden from screen readers, who read the lines on the
// chapter's card (ChapterPost.tsx), and on the opening, where the name is.
export default function Bubble() {
  const { index, since } = useStory();
  const isStill = useReducedMotion();
  const chapter = index >= 0 ? CHAPTERS[index] : undefined;
  const [shown, setShown] = useState(-1);
  const boxRef = useRef<HTMLDivElement | null>(null);

  // The line to show, checked a few times a second.
  useEffect(() => {
    if (!chapter) return;
    const count = chapter.lines.length;
    const check = () =>
      setShown(shownLine(performance.now() / 1000 - since, count));
    check();
    const timer = setInterval(check, 150);
    return () => clearInterval(timer);
  }, [chapter, since]);

  // Across, over the head, as HeadFraming glides it.
  useEffect(() => {
    let frame = 0;
    const follow = () => {
      const x = Number.isNaN(framedHead.x) ? innerWidth / 2 : framedHead.x;
      boxRef.current?.style.setProperty('--bubble-x', `${Math.round(x)}px`);
      frame = requestAnimationFrame(follow);
    };
    frame = requestAnimationFrame(follow);
    return () => cancelAnimationFrame(frame);
  }, []);

  const lines = !chapter
    ? []
    : isStill
      ? chapter.lines
      : shown >= 0
        ? [chapter.lines[shown]!]
        : [];

  return (
    <div
      ref={boxRef}
      aria-hidden
      data-bubble
      style={{ top: `calc(${HEAD_TOP * 100}dvh - 0.75rem)` }}
      className={`pointer-events-none fixed left-[clamp(9.5rem,var(--bubble-x,50vw),calc(100vw-9.5rem))] z-30 w-max max-w-[min(21rem,calc(100vw-2rem))] -translate-x-1/2 -translate-y-full transition-opacity duration-300 ${
        lines.length ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <div className="relative flex flex-col gap-2 rounded-2xl bg-head-dark/70 px-4 py-2.5 text-center text-base leading-snug text-head-light md:text-lg">
        {lines.map((line, k) => (
          <p key={`${index}-${isStill ? k : shown}`}>{line}</p>
        ))}
        <span className="absolute left-1/2 top-full size-0 -translate-x-1/2 border-x-8 border-t-8 border-x-transparent border-t-head-dark/70" />
      </div>
    </div>
  );
}
