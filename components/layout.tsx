import Head from 'next/head';
import { Container } from 'react-bootstrap';

import Footer from './footer';
import Header from './header';

type LayoutType = {
  children: JSX.Element;
  title?: string;
};

export default function Layout({ children, title = '' }: LayoutType) {
  return (
    <>
      <Head>
        <title>{`${title} - Zack Greenbauer`}</title>
        <meta
          name="description"
          content="Zack Greenbauer's Portfolio and Sandbox"
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Header title={title} />
      <main>
        <div className="app-body">
          <Container>{children}</Container>
        </div>
        <Footer />
      </main>
    </>
  );
}
