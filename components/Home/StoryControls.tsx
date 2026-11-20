'use client';

import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  DialogTitle,
} from '@headlessui/react';
import { useState } from 'react';

import Button from '@/components/Button';
import { requestGlide, requestJump } from '@/components/PageScroller/pageGlide';
import useReducedMotion from '@/hooks/useReducedMotion';

import { CHAPTERS } from './chapters';
import { useStory } from './storyState';

// The story's controls (data-watch: pressing them doesn't stop Watch,
// watch.ts). On a chapter's card: Chapters (the list, to jump to one),
// Play or Pause, and Next (on a wide screen; a phone swipes). On the opening, under the name: Watch my story,
// the page's main action, which starts it at once. With reduced motion
// there is no Watch: the story never moves on its own.
const LINK =
  'relative text-sm uppercase tracking-wider text-[color:var(--card-ink)] underline decoration-[color:var(--card-underline)] underline-offset-4 transition-[text-decoration-color] after:absolute after:-inset-x-2 after:-inset-y-3 after:content-[""] hover:decoration-[color:var(--card-accent)]';

export default function StoryControls({ isOpening = false }) {
  const { index, isWatching, setWatching } = useStory();
  const isStill = useReducedMotion();
  const isLast = index === CHAPTERS.length - 1;

  const watch = () => {
    setWatching(true);
    if (index < 0) requestGlide(1);
  };

  if (isOpening)
    return isStill ? null : (
      <div data-watch className="mt-6 flex justify-center lg:justify-start">
        <Button onClick={watch}>Watch my story</Button>
      </div>
    );

  return (
    <div data-watch className="flex items-center gap-6">
      <ChapterList index={index} />
      {!isStill && (
        <button
          type="button"
          className={LINK}
          aria-pressed={isWatching}
          onClick={() => setWatching(!isWatching)}
        >
          {isWatching ? 'Pause' : 'Play'}
        </button>
      )}
      {!isLast && (
        <button
          type="button"
          className={`${LINK} max-md:hidden`}
          onClick={() => requestGlide(1)}
        >
          Next
        </button>
      )}
    </div>
  );
}

// Chapters: every chapter in a frosted pane over the page, the one in view
// marked; picking one goes straight there. Like the header's Portfolio pane
// (Header/NavDropdown.tsx), everything under it blurs and the pane gets the
// photo glass's frost on the layer just before it (data-photo-lens,
// data-glass-over). A dialog, so it sits over the whole window, not inside
// the sliding card; Escape, a click outside or Close shuts it.
function ChapterList({ index }: { index: number }) {
  const [isOpen, setOpen] = useState(false);
  return (
    <>
      <button type="button" className={LINK} onClick={() => setOpen(true)}>
        Chapters
      </button>
      <Dialog
        open={isOpen}
        onClose={() => setOpen(false)}
        className="relative z-50"
      >
        <DialogBackdrop
          transition
          className="fixed inset-0 backdrop-blur-[6px] transition-opacity duration-300 data-[closed]:opacity-0"
        />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <div
            data-photo-lens
            aria-hidden
            className="pointer-events-none fixed [backdrop-filter:var(--photo-lens,none)]"
          />
          <DialogPanel
            transition
            data-glass
            data-glass-over
            className="flex max-h-[85dvh] w-80 flex-col gap-3 overflow-y-auto rounded-3xl p-6 text-[color:var(--card-ink)] transition-opacity duration-300 data-[closed]:opacity-0"
          >
            <div className="flex items-center justify-between gap-4">
              <DialogTitle className="text-sm uppercase tracking-widest">
                Chapters
              </DialogTitle>
              <button
                type="button"
                className={LINK}
                onClick={() => setOpen(false)}
              >
                Close
              </button>
            </div>
            <ol className="flex flex-col">
              {CHAPTERS.map((chapter, k) => (
                <li key={chapter.id}>
                  <button
                    type="button"
                    aria-current={k === index ? 'step' : undefined}
                    onClick={() => {
                      setOpen(false);
                      requestJump(k + 1);
                    }}
                    className={`w-full py-1 text-left hover:underline md:py-1.5 ${
                      k === index
                        ? 'underline decoration-[color:var(--card-accent)] underline-offset-4'
                        : ''
                    }`}
                  >
                    {chapter.title}
                  </button>
                </li>
              ))}
            </ol>
          </DialogPanel>
        </div>
      </Dialog>
    </>
  );
}
