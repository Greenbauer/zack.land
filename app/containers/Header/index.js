import PropTypes from 'prop-types'
import React, { useState, useEffect } from 'react'
import { connect } from 'react-redux'
import { compose } from 'redux'
import { createStructuredSelector } from 'reselect'
import { Container, Navbar, Nav } from 'react-bootstrap'
import { NavLink } from 'react-router-dom'

import { updateHeaderTitle } from 'containers/App/selectors'

import Collapse from './Collapse'
import Hamburger from './Hamburger'
import NavListBackground from './NavListBackground'

function Header(props) {
  const [isActive, setIsActive] = useState(false)
  const [isScrolling, setIsScrolling] = useState(false)

  // detect scrolling
  const handleScroll = () => {
    if (window.scrollY > 10) setIsScrolling(true)
    else setIsScrolling(false)
  }

  // toggle collapsing mobile menu
  const handleClick = () => setIsActive(!isActive)

  useEffect(() => {
    document.addEventListener('scroll', handleScroll)
    return () => document.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <Navbar
      className={`navbar-toggleable-sm fixed-top ${isScrolling && 'scrolling'}`}
    >
      <Container>
        <Collapse isActive={isActive}>
          <Nav activeKey="/" id="navbar">
            <Nav.Item onClick={handleClick}>
              <Nav.Link as={NavLink} exact to="/" activeClassName="active">
                Home
              </Nav.Link>
            </Nav.Item>

            <Nav.Item onClick={handleClick}>
              <Nav.Link as={NavLink} to="/portfolio" activeClassName="active">
                Portfolio
              </Nav.Link>
            </Nav.Item>

            <Nav.Item onClick={handleClick}>
              <Nav.Link as={NavLink} to="/contact" activeClassName="active">
                Contact
              </Nav.Link>
            </Nav.Item>

            <NavListBackground />
          </Nav>
        </Collapse>

        <Hamburger onClick={handleClick} isActive={isActive} />

        <div className="header-title">{props.title}</div>
      </Container>
    </Navbar>
  )
}

Header.propTypes = {
  title: PropTypes.string,
}

const mapStateToProps = createStructuredSelector({
  title: updateHeaderTitle(),
})

const withConnect = connect(
  mapStateToProps,
  {},
  null,
  { pure: true },
)

export default compose(withConnect)(Header)
