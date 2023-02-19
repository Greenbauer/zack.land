import { Col, Row } from 'react-bootstrap';
import { Element } from 'react-scroll';

import Button from '@/components/button';
import { Content } from '@/types';
import { toMenuId } from '@/utils/menu';

import Media from './media';

type PostType = { content: Content };

export default function Post({ content }: PostType) {
  const { name, src, desc, tech, siteUrl, repoUrl } = content;

  return (
    <div className="section">
      <Element name={toMenuId(name)} className="scroll-element" />
      <Row className="g-0">
        {!!src && <Media sources={src} />}
        <div className="article">
          <Col sm={12}>
            <h2>{name}</h2>
          </Col>
          {!!desc && <Col sm={12}>{desc}</Col>}
          {!!tech && (
            <Col sm={12}>
              <p>
                Technology used:
                <br />
                <small>{tech}</small>
              </p>
            </Col>
          )}
          {!!siteUrl && (
            <Col sm={12}>
              <Button href={siteUrl} target="_blank">
                Visit Site
              </Button>
            </Col>
          )}
          {!!repoUrl && (
            <Col sm={12}>
              <Button href={repoUrl} target="_blank">
                View Code
              </Button>
            </Col>
          )}
        </div>
      </Row>
    </div>
  );
}
