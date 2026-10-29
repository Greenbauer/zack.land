'use client';

import { NameWord } from '@/components/Home/Title';

// The page's title in the header's top right, drawn like the home page's
// name: as 3D letters in the head's skin reflecting the sky, turned so they
// stand out from what is behind them (Background/TitleName.tsx). The heading
// stays here, transparent, for screen readers and selection, and marks where
// each word sits, in the name's weight and spacing so the 3D letters fit
// over it. Its words register after the name's (from FIRST_WORD), and
// the name and a header title are never on one page. Until the scene is
// ready where WebGL is drawn in software it shows the title itself
// (data-scene-title in styles/globals.css).
const FIRST_WORD = 100;

export default function HeaderTitle({ title }: { title: string }) {
  return (
    <h4
      data-scene-title
      className="text-right font-medium tracking-wider !text-transparent [word-spacing:0.2em]"
    >
      {title.split(' ').map((word, k) => (
        <span key={word}>
          {k > 0 && ' '}
          <NameWord text={word} index={FIRST_WORD + k} />
        </span>
      ))}
    </h4>
  );
}
