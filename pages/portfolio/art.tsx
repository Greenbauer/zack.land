import { Row } from 'react-bootstrap'
import Card from '@/components/card'
import Layout from '@/components/layout'
import { Content } from '@/types'
import { get } from '@/utils/request'

async function getArtContents() {
  const key = process.env.BEHANCE_API_KEY
  const url = `https://api.behance.net/v2/users/greenbauer/projects?client_id=${key}`
  const { projects } = await get(url)

  return projects.map((project: any) => {
    const { name, url, covers } = project

    const content: Content = {
      name,
      url,
      src: [
        {
          key: covers.original,
          alt: name,
          type: 'img',
        },
      ],
    }

    return content
  })
}

export async function getStaticProps() {
  return {
    props: {
      contents: await getArtContents()
    },
    revalidate: 60,
  }
}

type ArtType = {
  contents: Content[]
}

export default function Art({ contents = [] }: ArtType) {
  return (
    <Layout title="Digital Art">
      <Row>
        <div className="card-columns">
          {contents.map(content => (
            <Card key={content.name} content={content} />
          ))
          }
        </div>
      </Row>
    </Layout>
  )
}
