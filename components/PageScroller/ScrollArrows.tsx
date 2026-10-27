'use client';

import { useEffect, useRef, useState } from 'react';

import { Chevrons } from '@/components/Menu/Arrow';
import useSkyColours from '@/components/SkyText/useSkyColours';

import { PAGE_SCROLLER_ID } from './edgeFade';
import { postPositions, requestGlide } from './pageGlide';

// Beside the portfolio's posts on a wide screen: the word Scroll, with the
// portfolio menu's sliding chevrons above it pointing up and below it
// pointing down. Each glides to the post before or after; each shows only
// while there is a post that way. Coloured from the sky behind them.
export default function ScrollArrows() {
  const ref = useRef<HTMLDivElement | null>(null);
  useSkyColours(ref);
  const [canGo, setCanGo] = useState({ up: false, down: false });

  useEffect(() => {
    const scroller = document.getElementById(PAGE_SCROLLER_ID);
    if (!scroller) return;
    const check = () => {
      const at = postPositions(scroller);
      if (!at.length) return;
      const { scrollTop } = scroller;
      const up = scrollTop > at[0]! + 4;
      const down = scrollTop < at[at.length - 1]! - 4;
      setCanGo((was) =>
        was.up === up && was.down === down ? was : { up, down },
      );
    };
    check();
    scroller.addEventListener('scroll', check, { passive: true });
    addEventListener('resize', check);
    return () => {
      scroller.removeEventListener('scroll', check);
      removeEventListener('resize', check);
    };
  }, []);

  return (
    <div
      ref={ref}
      className="sticky top-[var(--page-top)] flex h-[var(--post-height)] w-24 flex-col items-center justify-center gap-6 self-start"
    >
      <ScrollArrow direction={-1} isShown={canGo.up} />
      <span className="font-display text-sm uppercase tracking-[0.3em] text-[color:var(--sky-text)]">
        Scroll
      </span>
      <ScrollArrow direction={1} isShown={canGo.down} />
    </div>
  );
}

function ScrollArrow({
  direction,
  isShown,
}: {
  direction: 1 | -1;
  isShown: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={direction < 0 ? 'Scroll up' : 'Scroll down'}
      disabled={!isShown}
      onClick={() => requestGlide(direction)}
      className={`relative size-20 transition-opacity duration-500 ${
        isShown ? 'opacity-100' : 'invisible opacity-0'
      }`}
    >
      {/* The chevrons point left; turned a quarter, up or down. */}
      <span
        aria-hidden
        className={`absolute left-1/2 top-1/2 block ${
          direction < 0 ? 'rotate-90' : '-rotate-90'
        }`}
      >
        <Chevrons />
      </span>
    </button>
  );
}
