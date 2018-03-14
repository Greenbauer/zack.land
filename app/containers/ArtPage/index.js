// ArtPage

import PropTypes from 'prop-types'
import React from 'react'
import { Helmet } from 'react-helmet'
import { connect } from 'react-redux'
import { compose } from 'redux'
import { createStructuredSelector } from 'reselect'
import Scrollspy from 'react-scrollspy'

import injectReducer from 'utils/injectReducer'
import injectSaga from 'utils/injectSaga'

import Button from 'components/Button'
import Card from 'components/Card'
import CardBody from 'components/CardBody'
import CardColumns from 'components/CardColumns'
import Container from 'components/Container'
import H2 from 'components/H2'
import H3 from 'components/H3'
import Img from 'components/Img'
import LoadingIndicator from 'components/LoadingIndicator'
import Menu from 'components/Menu'
import MenuItem from 'components/MenuItem'
import Row from 'components/Row'
import Small from 'components/Small'

import { changePageHeader } from 'containers/App/actions'

import {
  makeBehanceLoading,
  makeBehanceError,
  makeBehanceSuccess,
  makeBehanceData,
} from './selectors'
import { loadData } from './actions'
import reducer from './reducer'
import saga from './saga'

// render media
const media = srcs => {
  let key = 0

  return srcs.map(src => {
    key++
    let col = 6

    // full width media on odd and every 3
    if (srcs.length % 2 != 0 && srcs.indexOf(src) % 3 == 0) {
      col = 12
    }

    // define if the media is an image or video
    let mediaType = (
      <Img
        className={`bg-white`}
        src={src.name}
        alt={src.alt}
        key={key}
      />
    )

    if (src.type == 'video') {
      mediaType = (
        <video src={src.name} key={key} />
      )
    }

    return mediaType
  })
}

// render button if there is a link
const button = (url, text) => (
    <Button className="left" href={url} target="_blank">
      {text}
    </Button>
)

// render projects
const Content = data => data.map(d => (
    <Card className={d.src ? '': 'no-img'} key={`d-${d.id}`}>
      <div
        id={`item:${d.name.replace(/ /g,"_")}`}
        className={`scroll-item`}
      />

        {d.src ? media(d.src) : ''}
          <CardBody>
            <H2>
              {d.name}
            </H2>

            {d.url ? button(d.url, 'View Gallery') : ''}
            </CardBody>

    </Card>
  )
)

export class ArtPage extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      title: 'Digital Art'
    }
  }

  componentWillMount() {
    this.props.onLoadState(this.state.title)
    this.props.onLoadProfile()
  }

  componentWillUpdate() {
    this.props.onLoadState(this.state.title)
  }

  render() {
    const { loading, error, data } = this.props

    return (
      <Container>
        <Helmet>
          <title>Graphic Design Portfolio</title>
          <meta name="description" content="Zachary Greenbauer's Graphic Design Portfolio" />
        </Helmet>
          <Row className="gutters">
            <CardColumns>
              {data ? Content(data) : (<LoadingIndicator />)}
            </CardColumns>
          </Row>
      </Container>
    )
  }
}

ArtPage.propTypes = {
  loading: PropTypes.bool,
  error: PropTypes.oneOfType([
    PropTypes.object,
    PropTypes.bool,
  ]),
  data: PropTypes.oneOfType([
    PropTypes.array,
    PropTypes.bool,
  ]),
  onLoadState: PropTypes.func,
  onLoadProfile: PropTypes.func.isRequired
}

export function mapDispatchToProps(dispatch) {
  return {
    onLoadState: (title) => {
      dispatch(changePageHeader(title))
    },
    onLoadProfile: (evt) => { dispatch(loadData()) },
  }
}

const mapStateToProps = createStructuredSelector({
  data: makeBehanceData(),
  loading: makeBehanceLoading(),
  error: makeBehanceError(),
})

const withConnect = connect(mapStateToProps, mapDispatchToProps)

const withReducer = injectReducer({ key: 'art', reducer })
const withSaga = injectSaga({ key: 'art', saga })

export default compose(
  withReducer,
  withSaga,
  withConnect,
)(ArtPage)
