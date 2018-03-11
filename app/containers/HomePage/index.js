// HomePage

import PropTypes from 'prop-types'
import React from 'react'
import { Helmet } from 'react-helmet'
import { connect } from 'react-redux'
import { compose } from 'redux'
import { createStructuredSelector } from 'reselect'

import { changePageHeader } from 'containers/App/actions'

import Column from 'components/Column'
import Container from 'components/Container'
import H1 from 'components/H1'
import H2 from 'components/H2'
import Row from 'components/Row'

export class HomePage extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      title: ''
    }
  }

  componentWillMount() {
    this.props.onLoadState(this.state.title)
  }

  render() {

    return (
      <Container>
        <Helmet>
          <title>Home</title>
          <meta name="description" content="Zack Greenbauer's Portfolio and Sandbox" />
        </Helmet>
        <Row className="cover">
          <Column className="md-6">

          </Column>
          <Column className="md-6">
            <H1>
              {"Zack Greenbauer's"}
            </H1>
            <H2>
              Portfolio and Sandbox
            </H2>
          </Column>
        </Row>
      </Container>
    )
  }
}

HomePage.PropTypes = {
  onLoadState: PropTypes.func,
}

export function mapDispatchToProps(dispatch) {
  return {
    onLoadState: (title) => {
      dispatch(changePageHeader(title))
    },
  }
}

const mapStateToProps = createStructuredSelector({})

const withConnect = connect(mapStateToProps, mapDispatchToProps);

export default compose(
  withConnect,
)(HomePage)
