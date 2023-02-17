import Link from 'next/link';
import { useRouter } from 'next/router';
import { Col, Container, Row } from 'react-bootstrap';

import styles from './footer.module.scss';
import SocialLinks from './socialLinks';

function defaultText() {
  return (
    <h6>
      I can make almost anything, and would love to help you develop your idea.
      <br />
      <Link className="underline" href="/contact">
        Contact me
      </Link>
      .
    </h6>
  );
}

function contactPageText() {
  return (
    <h6>
      Please fill out this form.
      <br />
      Ill will respond as soon as I can.
    </h6>
  );
}

export default function Footer() {
  const router = useRouter();

  return (
    <footer>
      <Container>
        <Row>
          <Col md={6} className={styles.footerSocialLinks}>
            <SocialLinks />
          </Col>
          <Col md={6} className={styles.footerText}>
            {router.pathname === '/contact' ? contactPageText() : defaultText()}
          </Col>
        </Row>
      </Container>
    </footer>
  );
}
