import React from 'react'
import PropTypes from 'prop-types'
import { Col, Container, Row } from 'react-bootstrap'
import { Link, withRouter } from 'react-router-dom'

import Icons from './Icons'

function defaultText() {
  return (
    <h6>
      I can make almost anything, and would love to help you develop your idea.
      &nbsp;
      <br />
      <Link className="underline" to="/contact">
        Contact me
      </Link>
      .
    </h6>
  )
}

function contactPageText() {
  return (
    <h6>
      Please fill out this form.
      <br />
      Ill will respond as soon as I can.
    </h6>
  )
}

function Footer({ location, staticContext, ...props }) {
  return (
    <footer {...props}>
      <Container>
        <Row>
          <Col md={5} className="footer-icons text-left">
            <Icons />
          </Col>
          <Col md={7} className="footer-text text-right">
            {location.pathname === '/contact'
              ? contactPageText()
              : defaultText()}
          </Col>
        </Row>
      </Container>
    </footer>
  )
}

Footer.propTypes = {
  location: PropTypes.object,
  staticContext: PropTypes.object,
}

export default withRouter(Footer)
