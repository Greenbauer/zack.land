import PropTypes from 'prop-types'
import React, { useEffect } from 'react'
import { Helmet } from 'react-helmet'
import { connect } from 'react-redux'
import { compose } from 'redux'
import { createStructuredSelector } from 'reselect'
import { Col, Container, Row } from 'react-bootstrap'

import Menu from 'components/Menu'
import Post from 'components/Post'

import { changePageHeader } from 'containers/App/actions'

import apps from './apps'

function AppsPage(props) {
  useEffect(() => props.onLoadState('Web Applications'), [])

  return (
    <Container>
      <Helmet>
        <title>Apps Portfolio</title>
        <meta
          name="description"
          content="Zachary Greenbauer's Apps Portfolio"
        />
      </Helmet>
      <Row>
        <Col md={4} className="d-none d-md-block">
          <Menu items={apps} />
        </Col>
        <Col md={8}>
          {apps.map(item => (
            <Post key={item.name} item={item} />
          ))}
        </Col>
      </Row>
    </Container>
  )
}

AppsPage.propTypes = {
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

export default compose(withConnect)(AppsPage)
