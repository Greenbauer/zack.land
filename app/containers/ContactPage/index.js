import PropTypes from 'prop-types'
import React, { useEffect } from 'react'
import { Helmet } from 'react-helmet'
import { connect } from 'react-redux'
import { compose } from 'redux'
import { createStructuredSelector } from 'reselect'
import { Col, Container, Row } from 'react-bootstrap'

import { changePageHeader } from 'containers/App/actions'

import ContactForm from '../ContactForm'

function ContactPage(props) {
  useEffect(() => props.onLoadState('Contact Me'), [])

  return (
    <Container>
      <Helmet>
        <title>Contact Me</title>
        <meta name="description" content="Contact Me" />
      </Helmet>
      <Row>
        <Col sm={4} />
        <Col sm={8}>
          <div className="section form-section">
            <div className="article">
              <ContactForm />
            </div>
          </div>
        </Col>
      </Row>
    </Container>
  )
}

ContactPage.propTypes = {
  onLoadState: PropTypes.func,
}

function mapDispatchToProps(dispatch) {
  return {
    onLoadState: title => {
      dispatch(changePageHeader(title))
    },
  }
}

const mapStateToProps = createStructuredSelector({})

const withConnect = connect(
  mapStateToProps,
  mapDispatchToProps,
)

export default compose(withConnect)(ContactPage)
