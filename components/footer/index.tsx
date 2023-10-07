'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import SocialLinks from './SocialLinks';

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
  return <h6>Please fill out this form. Ill will respond as soon as I can.</h6>;
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
