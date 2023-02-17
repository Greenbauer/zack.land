import Head from 'next/head'
import { Container } from 'react-bootstrap'
import Header from './header'
import Footer from './footer'
import Background from './background'
import { Open_Sans, Roboto } from '@next/font/google'

const openSans = Open_Sans({ subsets: ['latin'] })
const roboto = Roboto({ subsets: ['latin'], weight: ['100', '400'] })

type LayoutType = {
    children: JSX.Element
    title?: string
}

export default function Layout({ children, title = '' }: LayoutType) {
    return (
        <>
            <style jsx global>
                {`
                    main {
                        font-family: ${openSans.style.fontFamily};
                    }

                    h2, h6, small, .text-muted {
                        font-family: ${roboto.style.fontFamily};
                    }
                `}
            </style>
            <Head>
                <title>{`${title} - Zack Greenbauer`}</title>
                <meta name="description" content="Zack Greenbauer's Portfolio and Sandbox" />
                <meta name="viewport" content="width=device-width, initial-scale=1" />
                <link rel="icon" href="/favicon.ico" />
            </Head>
            <Header title={title} />
            <main>
                <div className="app-body">
                    <Container>
                        {children}
                    </Container>
                </div>
                <Footer />
                <Background />
            </main>
        </>
    )
}
