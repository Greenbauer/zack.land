import Head from 'next/head';
import { Container } from 'react-bootstrap';

import useWindowSize from '@/hooks/useWindowSize';

import Footer from './footer';
import Header from './header';

type LayoutType = {
  children: JSX.Element;
  title?: string;
};

export default function Layout({ children, title = '' }: LayoutType) {
  const { height } = useWindowSize();

  return (
    <>
      <Head>
        <title>{`${!!title ? `${title} - ` : ''}Zack Greenbauer`}</title>
        <meta
          name="description"
          content="Zack Greenbauer's Portfolio and Sandbox"
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main style={{ height: height || '100vh' }}>
        <Header title={title} />
        <div className="app-body">
          <Container>{children}</Container>
        </div>
        <Footer />
      </main>
    </>
  );
}
