'use client';

import { NameWord } from '@/components/Home/Title';

// The page's title in the header's top right, drawn like the home page's
// name: as 3D letters in the head's skin reflecting the sky, turned so they
// stand out from what is behind them (Background/TitleName.tsx). The heading
// stays here, transparent, for screen readers and selection, and marks where
// each word sits, in the name's weight and spacing so the 3D letters fit
// over it. Its words register after the name's (from FIRST_WORD), and
// the name and a header title are never on one page. Until the scene first
// draws, where WebGL is drawn in software, it shows the title itself
// (data-scene-title in styles/globals.css). It is the page's one h1, in the
// look of an h4 (.text-h4) without the h1's background (its gradient and
// dark colour, clipped to the text, would show through the see-through text).
const FIRST_WORD = 100;

export default function HeaderTitle({ title }: { title: string }) {
  return (
    <h1
      data-scene-title
      className="text-h4 !bg-transparent !bg-none text-right font-medium tracking-wider !text-transparent [word-spacing:0.2em] max-md:text-2xl"
    >
      {title.split(' ').map((word, k) => (
        <span key={word}>
          {k > 0 && ' '}
          <NameWord text={word} index={FIRST_WORD + k} />
        </span>
      ))}
    </h1>
  );
}
