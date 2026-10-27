'use client';

import { useEffect, useRef, useState } from 'react';

import { readableText, watchBackdrop } from '@/components/Background/backdrop';
import { titleWords } from '@/components/Background/titleWords';

// The home page's title over the 3D background.
//
// The name is drawn in the 3D scene as letters in the head's own skin,
// reflecting the same sky (Background/TitleName.tsx). The heading here stays
// in place, transparent, so screen readers, search and selection still have
// it, and marks where each word sits for the 3D letters to follow. It clears
// both the global h1's gradient and its background colour: the colour is
// clipped to the letters too and would draw a dark copy under the 3D ones.
//
// The subtitle is white wherever the sky allows, and over a sky too light for
// white (the pink sunrise) darkens toward the skin's indigo-black only as far
// as WCAG AA needs. Its weight is thin, so it is held to the 4.5:1 of normal
// text rather than the 3:1 its size would allow. BackdropSampler measures the
// sky behind it a few times a second.

const NAME = ['Zack', "Greenbauer's"];
const SUBTITLE_LIGHT: [number, number, number] = [255, 255, 255];
const SUBTITLE_DARK: [number, number, number] = [14, 12, 32];
const SUBTITLE_RATIO = 4.5;
// The canvas's colour before the sky loads (#6864a8, Background/index.tsx).
const LOADING_SKY = 0.148;

export function NameWord({ text, index }: { text: string; index: number }) {
  const word = useRef<HTMLSpanElement>(null);
  const baseline = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (!word.current || !baseline.current) return;
    titleWords.set(index, {
      text: text.toUpperCase(),
      word: word.current,
      baseline: baseline.current,
    });
    return () => {
      titleWords.delete(index);
    };
  }, [text, index]);
  return (
    <span ref={word} className="inline-block">
      {/* Zero-size and sitting on the baseline: its top is the baseline. */}
      <span ref={baseline} className="inline-block size-0 align-baseline" />
      {text}
    </span>
  );
}

export default function Title() {
  const subtitle = useRef<HTMLHeadingElement>(null);
  const [subtitleColour, setSubtitleColour] = useState(
    readableText(LOADING_SKY, SUBTITLE_RATIO, SUBTITLE_LIGHT, SUBTITLE_DARK),
  );

  useEffect(() => {
    if (!subtitle.current) return;
    // The lightest part of the sky behind it decides.
    return watchBackdrop(subtitle.current, (samples) =>
      setSubtitleColour(
        readableText(
          Math.max(...samples),
          SUBTITLE_RATIO,
          SUBTITLE_LIGHT,
          SUBTITLE_DARK,
        ),
      ),
    );
  }, []);

  return (
    <>
      <h1 className="!bg-transparent !bg-none !text-transparent">
        {NAME.map((text, index) => (
          <span key={text}>
            {index > 0 && ' '}
            <NameWord text={text} index={index} />
          </span>
        ))}
      </h1>
      <h2
        ref={subtitle}
        className="transition-colors duration-300"
        style={{ color: `rgb(${subtitleColour.join(' ')})` }}
      >
        Portfolio and Sandbox
      </h2>
    </>
  );
}
