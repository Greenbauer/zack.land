import { Col, Row } from 'react-bootstrap';

import Layout from '@/components/layout';

export default function Home() {
  return (
    <Layout>
      <Row className="cover">
        <Col md={6} />
        <Col md={6}>
          <h1>Zack Greenbauer’s</h1>
          <h2>Portfolio and Sandbox</h2>
        </Col>
      </Row>
    </Layout>
  );
}
