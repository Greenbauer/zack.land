import { RefObject, useEffect } from 'react';

import { watchBackdrop } from '@/components/Background/backdrop';
import { skyState } from '@/components/Background/skyState';

import { skyBehind, skyColours } from './skyColours';

// Keeps the colours of what sits over the sky inside `ref` readable as the
// sky behind it turns (skyColours.ts). They are written to the element as
// --sky-text, --sky-muted, --sky-faint, --sky-accent, --sky-underline and
// --sky-halo, which its children use, without re-rendering; each change fades
// (the .sky-colours class in styles/globals.css). Until the sky is first
// measured, the defaults there apply. While the sky rests at its view's home (skyState) the
// text takes that sky's side, light or dark, whatever the pointer or the head
// does.
export default function useSkyColours(ref: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    element.classList.add('sky-colours');
    let last = '';
    let onDark: boolean | undefined;
    return watchBackdrop(element, (samples) => {
      const colours = skyColours(
        skyBehind(samples),
        onDark,
        skyState.settled ? !skyState.light : undefined,
      );
      onDark = colours.onDark;
      const key = colours.text + colours.accent;
      if (key === last) return;
      last = key;
      for (const name of [
        'text',
        'muted',
        'faint',
        'accent',
        'underline',
        'halo',
      ] as const)
        element.style.setProperty(`--sky-${name}`, colours[name]);
    });
  }, [ref]);
}
