import { Card as BSCard, Col } from 'react-bootstrap';

import Button from '@/components/button';
import { Content } from '@/types';

import Media from '../media';
import styles from './card.module.scss';

type CardType = { content: Content };

export default function Card({ content }: CardType) {
  const { name, galleryUrl, src } = content;

  return (
    <BSCard className={styles.card}>
      {!!src && <Media sources={src} />}
      <BSCard.Body className={styles.cardBody}>
        <h2>{name}</h2>
        {!!galleryUrl && (
          <Col sm={12}>
            <Button href={galleryUrl} target="_blank">
              View Gallery
            </Button>
          </Col>
        )}
      </BSCard.Body>
    </BSCard>
  );
}
