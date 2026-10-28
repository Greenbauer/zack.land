'use client';

import { CSSProperties, ReactNode, useEffect, useRef } from 'react';

// A frosted-glass card (a `section`: components/Background/glass.ts draws its
// glass) whose glass runs flat out past the window's right side, and on a
// phone its left side too: by the distance from the space it sits in to that
// side (--to-right, --to-left, measured here) plus 15rem, its padding keeping
// what is inside where it was. The glass's rounded, feathered corners fall
// off screen, so there the card meets the window's edge square and only
// fades out at its top and bottom. Its box is content-box, so a width given
// to it is its content's. A post's card also starts at --head-clear, which
// the post sets (components/useHeadClear.ts). On a wide screen the 3D head
// centres itself in the space left of it (data-head-avoid,
// components/Background/headPlace.ts).
export default function EdgeCard({
  className = '',
  style,
  children,
}: {
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
}) {
  const cardRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const card = cardRef.current;
    const space = card?.parentElement;
    if (!card || !space) return;
    const measure = () => {
      const { left, right } = space.getBoundingClientRect();
      card.style.setProperty('--to-left', `${Math.round(left)}px`);
      card.style.setProperty(
        '--to-right',
        `${Math.round(innerWidth - right)}px`,
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
        data-head-avoid="card"
        style={{
          marginLeft: 'calc(var(--head-clear, 0px) - var(--bleed-left, 0px))',
          paddingLeft: 'var(--bleed-left, 0px)',
          marginRight: 'calc(-1 * var(--bleed-right))',
          paddingRight: 'var(--bleed-right)',
          ...style,
        }}
        className={`box-content [--bleed-right:calc(var(--to-right,0px)+15rem)] max-md:[--bleed-left:calc(var(--to-left,0px)+15rem)] ${className}`}
      >
        {children}
      </section>
    </>
  );
}
