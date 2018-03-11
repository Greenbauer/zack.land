// AppsPage

import PropTypes from 'prop-types'
import React from 'react'
import { Helmet } from 'react-helmet'
import { connect } from 'react-redux'
import { compose } from 'redux'
import Scrollspy from 'react-scrollspy'
import { createStructuredSelector } from 'reselect'

import Article from 'components/Article'
import Button from 'components/Button'
import Column from 'components/Column'
import Container from 'components/Container'
import H2 from 'components/H2'
import H3 from 'components/H3'
import Img from 'components/Img'
import Menu from 'components/Menu'
import MenuItem from 'components/MenuItem'
import Row from 'components/Row'
import Section from 'components/Section'
import Small from 'components/Small'

import { changePageHeader } from 'containers/App/actions'

import data from './apps'

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
      <Img src={src.name} alt={src.alt} />
    )

    if (src.type == 'video') {
      mediaType = (
        <video src={src.name} />
      )
    }

    return (
      <Column className={`sm-${col}`} key={key}>
        {mediaType}
      </Column>
    )
  })
}

// render button
const button = (url, text) => (
  <Column className="sm-12">
    <Button className="left" href={url} target="_blank">
      {text}
    </Button>
  </Column>
)

// render content
const content = data.apps.map(d => (
  <Section className={d.src ? '': 'no-img'}
    key={`d-${d.id}`}
  >
    <div
      id={`item:${d.name.replace(/ /g,"_")}`}
      className={`scroll-item`}
    />
    <Row>
      {d.src ? media(d.src) : ''}
      <Article>
        <Column className="sm-12">
          <H2>
            {d.name}
          </H2>
        </Column>
        <Column className="sm-12">
          {d.desc}
        </Column>
        <Column className="sm-12">
          <p>
            Technology used: <br />
            <Small>
              {d.tech}
            </Small>
          </p>
        </Column>
          {d.url ? button(d.url, 'Visit Site') : ''}
          {d.repo ? button(d.repo, 'View Repo') : ''}
      </Article>
    </Row>
  </Section>
))

// scroll menu items
const menuItems = data.apps.map(d => (
  <MenuItem key={`menu-${d.name}`}>
    <H3>
      <a href={`#item:${d.name.replace(/ /g,"_")}`}>
        {d.name}
      </a>
    </H3>
  </MenuItem>
))

// scrollspy item count
const scrollItems = data.apps.map(d => (
  `item:${d.name.replace(/ /g,"_")}`
))

export class AppsPage extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      title: 'Web Applications'
    }
  }

  componentWillMount() {
    this.props.onLoadState(this.state.title)
  }

  componentWillUpdate() {
    this.props.onLoadState(this.state.title)
  }

  render() {
    return (
      <Container>
        <Helmet>
          <title>Apps Portfolio</title>
          <meta name="description" content="Zachary Greenbauer's Apps Portfolio" />
        </Helmet>
        <Row>
          <Column className="md-4">
            <Menu>
              <Scrollspy
                items={[...scrollItems]}
                currentClassName="active"
                offset={500}
              >
                {menuItems}
              </Scrollspy>
            </Menu>
          </Column>

          <Column className="md-8">
            {content}
          </Column>
        </Row>
      </Container>
    )
  }
}

AppsPage.PropTypes = {
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

const withConnect = connect(mapStateToProps, mapDispatchToProps)

export default compose(
  withConnect,
)(AppsPage)
