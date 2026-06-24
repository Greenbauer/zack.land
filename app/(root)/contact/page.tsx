import { Metadata } from 'next';
import Script from 'next/script';

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
      <section>
        <article>
          <Form />
        </article>
      </section>
    </div>
  );
}
