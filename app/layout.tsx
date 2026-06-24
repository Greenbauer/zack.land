import '@/styles/globals.css';

import { Analytics } from '@vercel/analytics/react';
import { Metadata } from 'next';
import { Kanit, Roboto } from 'next/font/google';
import { ReactNode } from 'react';

const SITE_URL = 'https://www.zack.land';
const SITE_DESCRIPTION = "Zack Greenbauer's Portfolio and Sandbox";

const SOCIAL_LINKS = [
  'https://github.com/Greenbauer',
  'https://www.linkedin.com/in/greenbauer',
  'https://www.instagram.com/zgreenbauer',
  'https://www.behance.net/greenbauer',
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
    'digital art',
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
    title: 'Zack Greenbauer',
    description: SITE_DESCRIPTION,
    images: ['/brand/og-image.png'],
  },
  icons: {
    icon: '/favicon.ico',
    apple: '/brand/apple-touch-icon.png',
  },
};

const kanit = Kanit({
  subsets: ['latin'],
  weight: ['100', '400'],
  variable: '--font-kanit',
});

const roboto = Roboto({
  subsets: ['latin'],
  weight: ['100', '400'],
  variable: '--font-roboto',
});

type RootLayoutProps = {
  children: ReactNode;
};

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en">
      <body
        className={`${kanit.variable} ${roboto.variable} flex min-h-[100svh] w-full justify-center bg-black`}
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
