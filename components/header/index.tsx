import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useRef, useState } from 'react';
import { Container, Nav, Navbar } from 'react-bootstrap';

import useScroll from '@/hooks/useScroll';
import useWindowSize from '@/hooks/useWindowSize';

import Collapse from './collapse';
import styles from './header.module.scss';
import MobileNavButton from './mobileNavButton';
import NavListBackground from './navListBackground';

type HeaderType = { title: string };

type LinkType = { label: string; path: string };

const links: LinkType[] = [
  {
    label: 'Home',
    path: '/',
  },
  {
    label: 'Portfolio',
    path: '/portfolio',
  },
  {
    label: 'Contact',
    path: '/contact',
  },
];

export default function Header({ title }: HeaderType) {
  const router = useRouter();
  const navRef = useRef<any>(null);
  const { isScrolling } = useScroll({ startLimit: 10 });
  const { width } = useWindowSize();
  const [isMenuActive, setIsMenuActive] = useState(false);
  const [offsetLeft, setOffsetLeft] = useState(0);

  const toggleMenu = () => setIsMenuActive(!isMenuActive);

  useEffect(() => {
    setOffsetLeft(navRef.current?.offsetLeft || 0);
  }, [width]);

  return (
    <Navbar
      className={`${styles.navbar} navbar-toggleable-sm fixed-top ${
        isScrolling && !isMenuActive ? 'scrolling' : ''
      }`}
    >
      <Container ref={navRef}>
        <Collapse isActive={isMenuActive}>
          <div className={styles.navContent}>
            <Nav activeKey={`/${router.pathname.split('/')[1]}`} id="navbar">
              {links.map(({ label, path }: LinkType) => (
                <Nav.Item key={label}>
                  <Nav.Link as={Link} href={path} onClick={toggleMenu}>
                    {label}
                  </Nav.Link>
                </Nav.Item>
              ))}
              <NavListBackground offsetLeft={offsetLeft} />
            </Nav>
          </div>
        </Collapse>
        <MobileNavButton onClick={toggleMenu} isActive={isMenuActive} />
        {!!title && <h5 className={styles.headerTitle}>{title}</h5>}
      </Container>
    </Navbar>
  );
}
