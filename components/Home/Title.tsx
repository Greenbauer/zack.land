'use client';

import { CSSProperties, useEffect, useRef, useState } from 'react';

import { watchBackdrop } from '@/components/Background/backdrop';
import { titleWords } from '@/components/Background/titleWords';
import { themeText } from '@/components/SkyText/skyColours';

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
//
// Below lg both sit at the top of the screen, above the head
// (app/(root)/page.tsx). On a phone the name fills the window's width on one
// line: its width is 10.34 times its font size (its letter spacing is in
// em, so it scales too), so the font is the width between the page's 0.75rem
// margins over that, a little under so it never wraps; the subtitle keeps
// its size to the name's (18px to 27.2px). Their line heights are in em too,
// so the gap between the lines stays in proportion at every width.

const NAME = ['Zack', "Greenbauer's"];
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
    themeText(LOADING_SKY, SUBTITLE_RATIO),
  );

  useEffect(() => {
    if (!subtitle.current) return;
    // The lightest part of the sky behind it decides.
    return watchBackdrop(subtitle.current, (samples) =>
      setSubtitleColour(themeText(Math.max(...samples), SUBTITLE_RATIO)),
    );
  }, []);

  return (
    <>
      {/* Where WebGL is drawn in software the scene loads only after the
          page has moved in (Background/sceneReady.ts), so until it first draws
          this heading shows the name itself, in the subtitle's colour
          (data-scene-title in styles/globals.css). */}
      <h1
        data-scene-title
        className="!bg-transparent !bg-none !text-transparent max-md:text-[length:calc((100vw_-_1.5rem)/10.34*0.97)] max-md:leading-[1.15] md:max-lg:text-5xl"
        style={
          {
            '--title-fallback': `rgb(${subtitleColour.join(' ')})`,
          } as CSSProperties
        }
      >
        {NAME.map((text, index) => (
          <span key={text}>
            {index > 0 && ' '}
            <NameWord text={text} index={index} />
          </span>
        ))}
      </h1>
      <h2
        ref={subtitle}
        className="transition-colors duration-300 max-md:text-[length:calc((100vw_-_1.5rem)/10.34*0.97*0.662)] max-md:leading-[1.2]"
        style={{ color: `rgb(${subtitleColour.join(' ')})` }}
      >
        Portfolio and Sandbox
      </h2>
    </>
  );
}
