import 'bootstrap/dist/css/bootstrap.min.css';
import '@/styles/globals.scss';

import { Open_Sans, Roboto } from '@next/font/google';
import type { AppProps } from 'next/app';

import Background from '@/components/background';
import useWindowSize from '@/hooks/useWindowSize';

const openSans = Open_Sans({ subsets: ['latin'] });
const roboto = Roboto({ subsets: ['latin'], weight: ['100', '400'] });

export default function App({ Component, pageProps }: AppProps) {
  const { height } = useWindowSize();

  return (
    <div style={{ height, width: '100vw', overflow: 'hidden' }}>
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
    </div>
  );
}
