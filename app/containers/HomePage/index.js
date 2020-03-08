import PropTypes from 'prop-types'
import React, { useEffect } from 'react'
import { Helmet } from 'react-helmet'
import { connect } from 'react-redux'
import { compose } from 'redux'
import { createStructuredSelector } from 'reselect'
import { Col, Container, Row } from 'react-bootstrap'

import { changePageHeader } from 'containers/App/actions'

function HomePage(props) {
  useEffect(() => props.onLoadState(''), [])

  return (
    <Container>
      <Helmet>
        <title>Home</title>
        <meta
          name="description"
          content="Zack Greenbauer's Portfolio and Sandbox"
        />
      </Helmet>
      <Row className="cover">
        <Col md={6} />
        <Col md={6}>
          <h1>Zack Greenbauer’s</h1>
          <h2>Portfolio and Sandbox</h2>
        </Col>
      </Row>
    </Container>
  )
}

HomePage.propTypes = {
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

export default compose(withConnect)(HomePage)
