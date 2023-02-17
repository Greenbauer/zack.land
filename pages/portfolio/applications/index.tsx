import { Col, Row } from 'react-bootstrap'
import Layout from '@/components/layout'
import Menu from '@/components/menu'
import Post from '@/components/post'
import Contents from './contents'

export default function Applications() {
  return (
    <Layout title={'Web Applications'}>
      <Row>
        <Col md={4} className="d-none d-md-block">
          <Menu
            items={Contents.map(content => ({ name: content.name }))}
          />
        </Col>
        <Col md={8}>
          {Contents.map(Content => (
            <Post key={Content.name} content={Content} />
          ))}
        </Col>
      </Row>
    </Layout>
  )
}
