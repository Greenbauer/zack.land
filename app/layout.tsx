import '@/styles/globals.css';

import { Analytics } from '@vercel/analytics/react';
import { Metadata } from 'next';
import { Kanit, Roboto } from 'next/font/google';
import { ReactNode } from 'react';

const SITE_URL = 'https://www.zack.land';
const SITE_DESCRIPTION = "Zack Greenbauer's Portfolio and Sandbox";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  description: SITE_DESCRIPTION,
  openGraph: {
    title: 'Zack Greenbauer',
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    siteName: 'zack.land',
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
        {children}
        <Analytics />
      </body>
    </html>
  );
}
