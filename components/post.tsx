import { Col, Row } from 'react-bootstrap'
import Button from '@/components/button'
import { Element } from 'react-scroll'
import { Content } from '@/types'
import Media from './media'

type PostType = { content: Content }

export default function Post({ content }: PostType) {
  const { name, url, src, desc, tech, repo } = content

  return (
    <div className="section">
      <Element name={name} className="scroll-element" />
      <Row className="g-0">
        {!!src && (
          <Media sources={src} />
        )}
        <div className="article">
          <Col sm={12}>
            <h2>
              {name}
            </h2>
          </Col>
          {!!desc && (
            <Col sm={12}>
              {desc}
            </Col>
          )}
          {!!tech && (
            <Col sm={12}>
              <p>
                Technology used:
                <br />
                <small>
                  {tech}
                </small>
              </p>
            </Col>
          )}
          {!!url && (
            <Col sm={12}>
              <Button href={url} target="_blank">
                View Gallery
              </Button>
            </Col>
          )}
          {!!repo && (
            <Col sm={12}>
              <Button href={repo} target="_blank">
                View Code
              </Button>
            </Col>
          )}
        </div>
      </Row>
    </div>
  )
}
