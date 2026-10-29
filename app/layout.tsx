import '@/styles/globals.css';

import { Analytics } from '@vercel/analytics/react';
import { Metadata } from 'next';
import localFont from 'next/font/local';
import { ReactNode } from 'react';

const SITE_URL = 'https://www.zack.land';
const SITE_DESCRIPTION = "Zack Greenbauer's Portfolio and Sandbox";

const SOCIAL_LINKS = [
  'https://github.com/Greenbauer',
  'https://www.linkedin.com/in/greenbauer',
  'https://x.com/greenbauer',
];

const personJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Person',
  name: 'Zack Greenbauer',
  url: SITE_URL,
  description: SITE_DESCRIPTION,
  sameAs: SOCIAL_LINKS,
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  description: SITE_DESCRIPTION,
  keywords: [
    'Zack Greenbauer',
    'portfolio',
    'web apps',
    '3D',
    'three.js',
    'creative developer',
    'designer',
  ],
  authors: [{ name: 'Zack Greenbauer', url: SITE_URL }],
  creator: 'Zack Greenbauer',
  alternates: {
    canonical: './',
  },
  openGraph: {
    title: 'Zack Greenbauer',
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    siteName: 'zack.land',
    locale: 'en_US',
    type: 'website',
    images: [
      {
        url: '/brand/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Zack Greenbauer — Portfolio and Sandbox',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    creator: '@greenbauer',
    title: 'Zack Greenbauer',
    description: SITE_DESCRIPTION,
    images: ['/brand/og-image.png'],
  },
  icons: {
    icon: '/favicon.ico',
    apple: '/brand/apple-touch-icon.png',
  },
};

// The two typefaces, served from the site itself (app/fonts, their Latin
// subsets as Google Fonts serves them; Kanit under the SIL Open Font Licence,
// Roboto under the Apache Licence 2.0), so building the site fetches nothing:
// next/font/google's build-time download failed now and then in CI.
const kanit = localFont({
  src: [
    { path: './fonts/kanit-100-latin.woff2', weight: '100' },
    { path: './fonts/kanit-400-latin.woff2', weight: '400' },
  ],
  variable: '--font-kanit',
});

// One variable file covers both weights the site uses (100 and 400).
const roboto = localFont({
  src: [{ path: './fonts/roboto-latin.woff2', weight: '100 900' }],
  variable: '--font-roboto',
});

type RootLayoutProps = {
  children: ReactNode;
};

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en">
      <body
        className={`${kanit.variable} ${roboto.variable} flex min-h-svh w-full justify-center bg-head-dark`}
      >
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd) }}
        />
        {children}
        <Analytics />
      </body>
    </html>
  );
}
