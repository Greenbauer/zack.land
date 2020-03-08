import PropTypes from 'prop-types'
import React from 'react'
import { Card, Col, Row } from 'react-bootstrap'

import Button from 'components/Button'
import YouTube from 'react-youtube'

const setMedia = srcs =>
  srcs.map(src => {
    let col = 6

    // full width media on odd and every 3
    if (srcs.length % 2 !== 0 && srcs.indexOf(src) % 3 === 0) {
      col = 12
    }

    // define if the media is an image or video
    let mediaType = <img src={src.name} alt={src.alt} />

    if (src.type === 'YouTube') {
      mediaType = (
        <div className="youtube">
          <YouTube videoId={src.name} />
        </div>
      )
    }

    return (
      <Col sm={col} key={src.name}>
        {mediaType}
      </Col>
    )
  })

const setListItems = items =>
  items.map(item => (
    <li key={`list-item-${item.name}`}>
      <Col sm={12}>
        <h4>
          <a href={item.url} target="_blank">
            {item.name}
          </a>
        </h4>
      </Col>
    </li>
  ))

const setButton = (url, text) => (
  <Col sm={12}>
    <Button href={url} target="_blank">
      {text}
    </Button>
  </Col>
)

function Post({ item, type }) {
  if (type === 'card') {
    return (
      <Card className={item.src ? '' : 'no-img'} key={`item-${item.name}`}>
        <div id={`${item.name.replace(/ /g, '-')}`} className="scroll-item" />
        {item.src && setMedia(item.src)}
        <Card.Body>
          <h2>{item.name}</h2>
          {item.url && setButton(item.url, 'View Gallery')}
        </Card.Body>
      </Card>
    )
  }

  return (
    <div
      className={`section ${!item.src && 'no-img'}`}
      key={`item-${item.name}`}
    >
      <div id={`${item.name.replace(/ /g, '-')}`} className="scroll-item" />
      <Row className="no-gutters">
        {item.src && setMedia(item.src)}
        <div className="article">
          <Col sm={12}>
            <h2>{item.name}</h2>
          </Col>
          <Col sm={12}>{item.desc}</Col>
          <Col sm={12}>
            <p>
              Technology used: <br />
              <small>{item.tech}</small>
            </p>
          </Col>
          {item.url && setButton(item.url, 'Visit Site')}
          {item.repo && setButton(item.repo, 'View Code')}
          {item.list && <ul>{setListItems(item.list)}</ul>}
        </div>
      </Row>
    </div>
  )
}

Post.propTypes = {
  item: PropTypes.object,
  type: PropTypes.string,
}

export default Post
