import { Metadata } from 'next';
import Script from 'next/script';

import EdgeCard from '@/components/EdgeCard';

import Form from './Form';

export const metadata: Metadata = {
  title: 'Contact - Zack Greenbauer',
  description: "Zack Greenbauer's Portfolio and Sandbox",
};

const recaptchaSiteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;

export default function Contact() {
  return (
    <div className="relative flex size-full justify-end">
      {recaptchaSiteKey && (
        <Script
          src={`https://www.google.com/recaptcha/api.js?render=${recaptchaSiteKey}`}
          strategy="afterInteractive"
        />
      )}
      {/* Its glass runs out past the window's right side (and a phone's
          left), like the portfolio's cards, and like theirs it slides in from
          the window's left edge as the form on it fades in. */}
      <EdgeCard className="motion-safe:animate-card-in">
        <article className="motion-safe:animate-content-in">
          <Form />
        </article>
      </EdgeCard>
    </div>
  );
}
