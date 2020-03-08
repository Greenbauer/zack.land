import PropTypes from 'prop-types'
import React, { useEffect } from 'react'
import { Switch, Route } from 'react-router-dom'
import { connect } from 'react-redux'
import { compose } from 'redux'
import { createStructuredSelector } from 'reselect'

import { changePageHeader } from 'containers/App/actions'
import AppsPage from 'containers/AppsPage/Loadable'
import ArtPage from 'containers/ArtPage/Loadable'
import MiscPage from 'containers/MiscPage/Loadable'

import PortfolioMenu from './PortfolioMenu'

function PortfolioPage(props) {
  useEffect(() => props.onLoadState('Portfolio'), [])

  return (
    <Switch>
      <Route exact path={props.match.url} component={PortfolioMenu} />
      <Route path={`${props.match.url}/apps`} component={AppsPage} />
      <Route path={`${props.match.url}/art`} component={ArtPage} />
      <Route path={`${props.match.url}/misc`} component={MiscPage} />
    </Switch>
  )
}

PortfolioPage.propTypes = {
  onLoadState: PropTypes.any,
  match: PropTypes.object.isRequired,
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

export default compose(withConnect)(PortfolioPage)
