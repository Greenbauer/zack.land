'use client';

import { CSSProperties, ReactNode, useEffect, useRef } from 'react';

import { bleedsPast } from './edgeBleed';

// A frosted-glass card (a `section`: components/Background/glass.ts draws its
// glass) whose glass runs flat out past the window's right side when that
// side is near (bleedsPast: nearer than the glass's soft edge reaches), and
// on a phone its left side too: by the distance from the space it sits in to
// that side (--to-right, --to-left, measured here) plus 15rem, its padding
// keeping what is inside where it was. The glass's rounded, feathered corners
// fall off screen, so there the card meets the window's edge square and only
// fades out at its top and bottom. On a window wider than the content's
// frame the right side is far, so the card ends with its own rounded edge
// (--bleed-right 0). Its box is content-box, so a width given
// to it is its content's. A post's card also starts at --head-clear, which
// the post sets (components/useHeadClear.ts). On a wide screen the 3D head
// centres itself in the space left of it (data-head-avoid,
// components/Background/headPlace.ts).
// `isAboveHead`: the card sits at the top of the window, over the head's
// crown, and the head stays centred under it (data-head-avoid="above",
// Background/HeadFraming.tsx) rather than moving away.
export default function EdgeCard({
  className = '',
  style,
  isAboveHead = false,
  children,
}: {
  className?: string;
  style?: CSSProperties;
  isAboveHead?: boolean;
  children: ReactNode;
}) {
  const cardRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const card = cardRef.current;
    const space = card?.parentElement;
    if (!card || !space) return;
    const measure = () => {
      const { left, right } = space.getBoundingClientRect();
      const toRight = Math.round(innerWidth - right);
      card.style.setProperty('--to-left', `${Math.round(left)}px`);
      card.style.setProperty('--to-right', `${toRight}px`);
      card.style.setProperty(
        '--bleed-right',
        bleedsPast(toRight) ? `calc(${toRight}px + 15rem)` : '0px',
      );
    };
    measure();
    const resize = new ResizeObserver(measure);
    resize.observe(space);
    addEventListener('resize', measure);
    return () => {
      resize.disconnect();
      removeEventListener('resize', measure);
    };
  }, []);

  // The glass over any photos under the card is drawn on the layer before it,
  // outside the card so it fades with the card rather than popping on at the
  // end (components/Background/photoLens.ts places it every frame).
  return (
    <>
      <div
        data-photo-lens
        aria-hidden
        className="pointer-events-none fixed [backdrop-filter:var(--photo-lens,none)]"
      />
      <section
        ref={cardRef}
        data-head-avoid={isAboveHead ? 'above' : 'card'}
        style={{
          marginLeft: 'calc(var(--head-clear, 0px) - var(--bleed-left, 0px))',
          paddingLeft: 'var(--bleed-left, 0px)',
          marginRight: 'calc(-1 * var(--bleed-right, 0px))',
          paddingRight: 'var(--bleed-right, 0px)',
          ...style,
        }}
        className={`box-content max-md:[--bleed-left:calc(var(--to-left,0px)+15rem)] ${className}`}
      >
        {children}
      </section>
    </>
  );
}
