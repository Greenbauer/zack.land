import { Col, Row } from 'react-bootstrap';

import Layout from '@/components/layout';

import Form from './form';

export default function Contact() {
  return (
    <Layout title="Contact Me">
      <Row>
        <Col sm={4} />
        <Col sm={8}>
          <div className="section form-section">
            <div className="article">
              <Form />
            </div>
          </div>
        </Col>
      </Row>
    </Layout>
  );
}