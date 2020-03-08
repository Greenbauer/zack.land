import PropTypes from 'prop-types'
import React, { useEffect } from 'react'
import { Helmet } from 'react-helmet'
import { connect } from 'react-redux'
import { compose } from 'redux'
import { createStructuredSelector } from 'reselect'
import { Container, Row } from 'react-bootstrap'

import injectReducer from 'utils/injectReducer'
import injectSaga from 'utils/injectSaga'

import Post from 'components/Post'
import Spinner from 'components/Spinner'

import { changePageHeader } from 'containers/App/actions'

import {
  makeBehanceLoading,
  makeBehanceError,
  makeBehanceData,
} from './selectors'
import { loadData } from './actions'
import reducer from './reducer'
import saga from './saga'

function ArtPage(props) {
  useEffect(() => {
    props.onLoadState('Digital Art')
    props.onLoadProfile()
  }, [])

  return (
    <Container>
      <Helmet>
        <title>Graphic Design Portfolio</title>
        <meta
          name="description"
          content="Zachary Greenbauer's Graphic Design Portfolio"
        />
      </Helmet>
      <Row>
        <div className="card-columns">
          {props.data ? (
            props.data.map(item => (
              <Post key={item.name} item={item} type="card" />
            ))
          ) : (
            <Spinner />
          )}
        </div>
      </Row>
    </Container>
  )
}

ArtPage.propTypes = {
  data: PropTypes.oneOfType([PropTypes.array, PropTypes.bool]),
  onLoadState: PropTypes.func,
  onLoadProfile: PropTypes.func.isRequired,
}

function mapDispatchToProps(dispatch) {
  return {
    onLoadState: title => dispatch(changePageHeader(title)),
    onLoadProfile: () => dispatch(loadData()),
  }
}

const mapStateToProps = createStructuredSelector({
  data: makeBehanceData(),
  loading: makeBehanceLoading(),
  error: makeBehanceError(),
})

const withConnect = connect(
  mapStateToProps,
  mapDispatchToProps,
)

const withReducer = injectReducer({ key: 'art', reducer })
const withSaga = injectSaga({ key: 'art', saga })

export default compose(
  withReducer,
  withSaga,
  withConnect,
)(ArtPage)
