// PortfolioMenu for PortfolioPage

import PropTypes from 'prop-types'
import React from 'react'
import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet'

import Column from 'components/Column'
import Container from 'components/Container'
import H3 from 'components/H3'
import Menu from 'components/Menu'
import MenuItem from 'components/MenuItem'
import Row from 'components/Row'

import Arrow from './Arrow'

class PortfolioMenu extends React.Component {

  render() {
    return (
      <Container>
        <Helmet>
          <title>Portfolio</title>
          <meta name="description" content="Zachary Greenbauer's Portfolio" />
        </Helmet>
        <Row>

          <Column className="md-4">
            <Menu className="needed">
                <MenuItem>
                  <H3>
                    <Link to={`${this.props.match.url}/apps`}>Web Apps</Link>
                  </H3>
                </MenuItem>

                <MenuItem>
                  <H3>
                    <Link to={`${this.props.match.url}/art`}>Digital Art</Link>
                  </H3>
                </MenuItem>

                <MenuItem>
                  <H3>
                    <Link to={`${this.props.match.url}/misc`}>Miscellaneous</Link>
                  </H3>
                </MenuItem>
                <Arrow />
            </Menu>
          </Column>

        </Row>
      </Container>
    )
  }
}

PortfolioMenu.PropTypes = {
  match: PropTypes.object.isRequired,
}

export default PortfolioMenu
