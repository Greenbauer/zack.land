import '@/styles/globals.css';

import { Analytics } from '@vercel/analytics/react';
import { Metadata, Viewport } from 'next';
import localFont from 'next/font/local';
import { ReactNode } from 'react';

import head from '@/theme/head.json';
import {
  OWNER_NAME,
  SITE_DESCRIPTION,
  SITE_IMAGE,
  SITE_NAME,
  SITE_URL,
  structuredData,
} from '@/utils/site';

// Each page names only itself (its `title`), and the template puts the
// owner's name after it; the home page has the name alone. The share tags
// take the page's title when they set none, and their address is the page's
// own (`./`, resolved per route as the canonical tag is).
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: OWNER_NAME, template: `%s - ${OWNER_NAME}` },
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
  authors: [{ name: OWNER_NAME, url: SITE_URL }],
  creator: OWNER_NAME,
  alternates: {
    canonical: './',
  },
  openGraph: {
    description: SITE_DESCRIPTION,
    url: './',
    siteName: SITE_NAME,
    locale: 'en_US',
    type: 'website',
    images: [
      {
        url: SITE_IMAGE,
        width: 1200,
        height: 630,
        alt: 'Zack Greenbauer — Portfolio and Sandbox',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    creator: '@greenbauer',
    description: SITE_DESCRIPTION,
    images: [SITE_IMAGE],
  },
  icons: {
    icon: '/favicon.ico',
    apple: '/brand/apple-touch-icon.png',
  },
};

// The phone browser's toolbar takes the page's own dark (theme/head.json).
export const viewport: Viewport = { themeColor: head.dark };

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
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData()) }}
        />
        {children}
        <Analytics />
      </body>
    </html>
  );
}
