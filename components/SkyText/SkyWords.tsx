'use client';

import { Fragment, ReactNode, useRef } from 'react';

import useSkyColours from './useSkyColours';

// Text over the sky that crosses both the sky and the 3D head, as the
// footer's does over the head's chest on a phone: each word takes its own
// colour from what is right behind it (useSkyColours with ownSide), light
// over the dark head and dark over a pale sky, so every part reads. Only the
// colour changes: no backing, glow or shadow.

export function SkyWord({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLSpanElement>(null);
  useSkyColours(ref, true);
  return (
    <span ref={ref} className="text-[color:var(--sky-text)]">
      {children}
    </span>
  );
}

export default function SkyWords({ text }: { text: string }) {
  return text.split(' ').map((word, k) => (
    <Fragment key={k}>
      {k > 0 && ' '}
      <SkyWord>{word}</SkyWord>
    </Fragment>
  ));
}
