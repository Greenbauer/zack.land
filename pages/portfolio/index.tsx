import { Col, Row } from 'react-bootstrap';

import Layout from '@/components/layout';
import Menu, { MenuItem } from '@/components/menu';

const items: MenuItem[] = [
  {
    name: 'Web Apps',
    path: '/portfolio/applications',
  },
  {
    name: 'Digital Art',
    path: '/portfolio/art',
  },
  {
    name: 'Miscellaneous',
    path: '/portfolio/miscellaneous',
  },
];

export default function Portfolio() {
  return (
    <Layout title="Portfolio">
      <Row>
        <Col md={4}>
          <Menu items={items} useArrow />
        </Col>
      </Row>
    </Layout>
  );
}
