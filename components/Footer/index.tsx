'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';

import useSkyColours from '@/components/SkyText/useSkyColours';

import { Swap, useArrowSwap } from './arrowSwap';
import SocialLinks from './SocialLinks';

// Shown only when reCAPTCHA is active — required by Google's terms when the
// badge is hidden (see styles/globals.css .grecaptcha-badge).
const recaptchaEnabled = !!process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;

function DefaultText() {
  return (
    <h6>
      I can make almost anything and would love to help develop your idea.{' '}
      <Link
        className="whitespace-nowrap text-[color:var(--sky-accent)] underline decoration-[color:var(--sky-underline)] underline-offset-4 hover:decoration-[color:var(--sky-accent)]"
        href="/contact"
      >
        Contact me
      </Link>
      .
    </h6>
  );
}

function ContactPageText() {
  // Wrapped in a single block so the disclosure stacks UNDER the heading and
  // inherits its alignment — the footer's text container is a flex row, so a
  // bare fragment would lay the two out side by side.
  return (
    <div>
      <h6>Please fill out this form. I will respond as soon as I can.</h6>
      {recaptchaEnabled && (
        <small className="mt-4 block text-[color:var(--sky-muted)]">
          This site is protected by reCAPTCHA and the Google{' '}
          <a
            href="https://policies.google.com/privacy"
            target="_blank"
            rel="noreferrer"
          >
            Privacy Policy
          </a>{' '}
          and{' '}
          <a
            href="https://policies.google.com/terms"
            target="_blank"
            rel="noreferrer"
          >
            Terms of Service
          </a>{' '}
          apply.
        </small>
      )}
    </div>
  );
}

// The text and links, and the arrow, for each step of their taking turns
// (arrowSwap.ts): the text fades out before the arrow fades in, and fades
// back in only after the scroll arrows above have.
const EXTRA: Record<Swap, string> = {
  text: 'opacity-100 transition-opacity duration-[400ms] delay-[500ms]',
  leaving: 'opacity-0 transition-opacity duration-[400ms]',
  arrow: 'hidden',
  returning: 'opacity-0',
};
const ARROW: Record<Swap, string> = {
  text: 'hidden',
  leaving: 'hidden',
  arrow: 'motion-safe:animate-fade-in',
  returning: 'hidden',
};

export default function Footer() {
  const pathname = usePathname();
  const ref = useRef<HTMLElement | null>(null);
  const slotRef = useRef<HTMLDivElement | null>(null);
  const phase = useArrowSwap(slotRef);
  // The icons and the text each take their colours from the sky behind them.
  const iconsRef = useRef<HTMLDivElement | null>(null);
  const textRef = useRef<HTMLDivElement | null>(null);
  useSkyColours(iconsRef);
  useSkyColours(textRef);
  // The footer sits on the sky, not on the cards' glass, on every screen:
  // the glass takes no colour of its own (components/Background/Grading.tsx),
  // so a card above it has no tint to match, and glass under the footer only
  // showed as a tinted pill while the phone menu's tint pass ran. What keeps
  // it readable where it crosses the head (its chest, on a phone) is a soft
  // halo of the other side's theme colour behind its text and icons
  // (--sky-halo, skyColours.ts): a light glow behind dark text, a dark one
  // behind light.

  // The page's bottom fade sits on the footer's top edge (see
  // components/PageScroller/edgeFade.ts), so it follows the footer's height.
  useEffect(() => {
    const footer = ref.current;
    if (!footer) return;
    const measure = () =>
      document.documentElement.style.setProperty(
        '--footer-height',
        `${footer.offsetHeight}px`,
      );
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(footer);
    return () => observer.disconnect();
  }, []);

  return (
    <footer
      ref={ref}
      className="relative flex w-full flex-col items-center gap-6 pb-6 md:flex-row md:items-end [&_a]:pointer-events-auto"
    >
      {/* Where the head can't fit beside the page, on the portfolio's
          pages, the scroll arrow moves in here (below) and is all the footer
          shows: the text and the social links (data-footer-extra) are left
          out, so the posts get the room. */}
      <div
        ref={iconsRef}
        data-footer-extra
        className={`order-last flex-none md:order-first [&_svg]:[filter:drop-shadow(0_0_0.2em_var(--sky-halo))] ${EXTRA[phase]}`}
      >
        <SocialLinks />
      </div>
      {/* On a phone the portfolio's down scroll arrow shares the text's row,
          at its left, a little in from the window's edge (data-footer-arrow,
          filled by ScrollArrows.tsx; empty and taking no room on every other
          page). */}
      <div
        ref={textRef}
        className={`order-first flex flex-1 items-center justify-end gap-4 text-center md:order-last md:text-right ${
          phase === 'arrow' ? 'justify-center' : ''
        } [&_h6]:text-[color:var(--sky-text)]`}
      >
        <div
          ref={slotRef}
          data-footer-arrow
          className={`ml-2 flex-none empty:hidden ${ARROW[phase]}`}
        />
        <div
          data-footer-extra
          className={`[text-shadow:0_0_0.1em_var(--sky-halo),0_0_0.25em_var(--sky-halo),0_0_0.6em_var(--sky-halo)] max-md:flex-1 ${EXTRA[phase]}`}
        >
          {pathname === '/contact' ? <ContactPageText /> : <DefaultText />}
        </div>
      </div>
    </footer>
  );
}
