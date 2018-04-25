// PortfolioPage

import PropTypes from 'prop-types'
import React from 'react'
import { Switch, Route } from 'react-router-dom'
import { connect } from 'react-redux'
import { compose } from 'redux'
import { createStructuredSelector } from 'reselect'

import { changePageHeader } from 'containers/App/actions'
import AppsPage from 'containers/AppsPage/Loadable'
import ArtPage from 'containers/ArtPage/Loadable'
import MiscPage from 'containers/MiscPage/Loadable'

import PortfolioMenu from './PortfolioMenu'

class PortfolioPage extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      title: 'Portfolio'
     }
  }

  componentWillMount() {
    this.props.onLoadState(this.state.title)
  }

  // componentWillUpdate() {
  //   this.props.onLoadState(this.state.title)
  // }

  render() {
    return (
      <Switch location={this.props.history.location}>
        <Route exact path={this.props.match.url} component={PortfolioMenu} />
        <Route path={`${this.props.match.url}/apps`} component={AppsPage} />
        <Route path={`${this.props.match.url}/art`} component={ArtPage} />
        <Route path={`${this.props.match.url}/misc`} component={MiscPage} />
        <Route path={`${this.props.match.url}/`} component={PortfolioMenu} />
      </Switch>
    )
  }
}

PortfolioPage.PropTypes = {
  onLoadState: PropTypes.string,
  match: PropTypes.object.isRequired,
}

export function mapDispatchToProps(dispatch) {
  return {
    onLoadState: (title) => {
      dispatch(changePageHeader(title))
    },
  }
}

const mapStateToProps = createStructuredSelector({})

const withConnect = connect(mapStateToProps, mapDispatchToProps)

export default compose(
  withConnect,
)(PortfolioPage)
