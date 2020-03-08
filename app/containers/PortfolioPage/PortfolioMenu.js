import PropTypes from 'prop-types'
import React from 'react'
import { Helmet } from 'react-helmet'
import { Col, Container, Row } from 'react-bootstrap'

import Menu from 'components/Menu'

function PortfolioMenu(props) {
  const items = [
    {
      name: 'Web Apps',
      route: `${props.match.url}/apps`,
    },
    {
      name: 'Digital Art',
      route: `${props.match.url}/art`,
    },
    {
      name: 'Miscellaneous',
      route: `${props.match.url}/misc`,
    },
  ]

  return (
    <Container>
      <Helmet>
        <title>Portfolio</title>
        <meta name="description" content="Zachary Greenbauer's Portfolio" />
      </Helmet>
      <Row>
        <Col md={4}>
          <Menu className="needed" items={items} useArrow />
        </Col>
      </Row>
    </Container>
  )
}

PortfolioMenu.propTypes = {
  match: PropTypes.object.isRequired,
}

export default PortfolioMenu
