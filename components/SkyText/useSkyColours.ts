import { RefObject, useEffect } from 'react';

import { watchBackdrop } from '@/components/Background/backdrop';
import { skyState } from '@/components/Background/skyState';

import { restingSide, skyBehind, skyColours, WORD_SHARE } from './skyColours';

// Keeps the colours of what sits over the sky inside `ref` readable as the
// sky behind it turns (skyColours.ts). They are written to the element as
// --sky-text, --sky-faint, --sky-accent and --sky-underline,
// which its children use, without re-rendering; each change fades (the
// .sky-colours class in styles/globals.css). Until the sky is first measured,
// the defaults there apply. While the sky rests at its view's home (skyState)
// the text takes that sky's side, light or dark, whatever the pointer or the
// head does; with `ownSide`, it follows only what is right behind it instead,
// as each word of the footer's text does (SkyWords.tsx), light over the dark
// head and dark over a pale sky.
export default function useSkyColours(
  ref: RefObject<HTMLElement | null>,
  ownSide = false,
) {
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    element.classList.add('sky-colours');
    let last = '';
    let onDark: boolean | undefined;
    return watchBackdrop(element, (samples) => {
      const colours = skyColours(
        skyBehind(samples, ownSide ? WORD_SHARE : undefined),
        // A single word takes the side its backdrop reads on, with no margin
        // holding it on its last one (its change still fades).
        ownSide ? undefined : onDark,
        restingSide(skyState, ownSide),
      );
      onDark = colours.onDark;
      const key = colours.text + colours.accent;
      if (key === last) return;
      last = key;
      for (const name of ['text', 'faint', 'accent', 'underline'] as const)
        element.style.setProperty(`--sky-${name}`, colours[name]);
    });
  }, [ref, ownSide]);
}
