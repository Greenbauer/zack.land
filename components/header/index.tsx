
import { useState } from 'react'
import { Container, Navbar, Nav } from 'react-bootstrap'
import Link from 'next/link'
import Collapse from './collapse'
import MenuButton from './menuButton'
import NavListBackground from './navListBackground'
import styles from '@/styles/Header.module.scss'
import { useRouter } from 'next/router'
import useScroll from '@/hooks/useScroll'

type HeaderType = { title: string }

type LinkType = { label: string, path: string }

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
  }
]

export default function Header({title}: HeaderType) {
  const router = useRouter()
  const { isScrolling } = useScroll({ startLimit: 10 })
  const [isMenuActive, setIsMenuActive] = useState(false)

  const toggleMenu = () => setIsMenuActive(!isMenuActive)

  return (
    <Navbar
      className={
        `${styles.navbar} navbar-toggleable-sm fixed-top ${isScrolling ? 'scrolling' : ''}`
      }
    >
      <Container>
        <Collapse isActive={isMenuActive}>
          <div className={styles.navContent}>
            <Nav activeKey={`/${router.pathname.split('/')[1]}`} id="navbar">
              {links.map(({ label, path }: LinkType) => (
                <Nav.Item key={label} onClick={toggleMenu}>
                  <Nav.Link as={Link} href={path}>
                    {label}
                  </Nav.Link>
                </Nav.Item>
              ))}
              <NavListBackground />
            </Nav>
          </div>
        </Collapse>
        <MenuButton onClick={toggleMenu} isActive={isMenuActive} />
        <h5 className={styles.headerTitle}>{title}</h5>
      </Container>
    </Navbar>
  )
}
