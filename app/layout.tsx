import '@/styles/globals.css';

import { Analytics } from '@vercel/analytics/react';
import { Kanit, Roboto } from 'next/font/google';
import { ReactElement } from 'react';

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
  children: ReactElement;
};

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en">
      <body
        className={`${kanit.variable} ${roboto.variable} flex h-screen w-full justify-center bg-black`}
      >
        {children}
        <Analytics />
      </body>
    </html>
  );
}
