'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import SocialLinks from './SocialLinks';

// Shown only when reCAPTCHA is active — required by Google's terms when the
// badge is hidden (see styles/globals.css .grecaptcha-badge).
const recaptchaEnabled = !!process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;

function DefaultText() {
  return (
    <h6>
      I can make almost anything, and would love to help develop your idea.{' '}
      <Link
        className="underline decoration-pink underline-offset-4 hover:decoration-yellow"
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
      <h6>Please fill out this form. Ill will respond as soon as I can.</h6>
      {recaptchaEnabled && (
        <small className="mt-4 block">
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

export default function Footer() {
  const pathname = usePathname();

  return (
    <footer className="flex w-full flex-col items-center gap-6 pb-6 md:flex-row md:items-end">
      <div className="order-last flex-none md:order-first">
        <SocialLinks />
      </div>
      <div className="order-first flex flex-1 justify-end text-center md:order-last md:text-right">
        {pathname === '/contact' ? <ContactPageText /> : <DefaultText />}
      </div>
    </footer>
  );
}
