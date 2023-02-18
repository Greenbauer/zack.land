import 'bootstrap/dist/css/bootstrap.min.css';
import '@/styles/globals.scss';

import { Open_Sans, Roboto } from '@next/font/google';
import type { AppProps } from 'next/app';

import Background from '@/components/background';

const openSans = Open_Sans({ subsets: ['latin'] });
const roboto = Roboto({ subsets: ['latin'], weight: ['100', '400'] });

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <style jsx global>
        {`
          main {
            font-family: ${openSans.style.fontFamily};
          }

          h2,
          h6,
          small,
          .text-muted {
            font-family: ${roboto.style.fontFamily};
          }
        `}
      </style>
      <Component {...pageProps} />
      <Background />
    </>
  );
}
