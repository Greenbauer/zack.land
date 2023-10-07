import { Metadata } from 'next';

import Card from '@/components/Card';
import { Content } from '@/types';
import { get } from '@/utils/request';

export const metadata: Metadata = {
  title: 'Digital Art - Zack Greenbauer',
  description: "Zack Greenbauer's Portfolio and Sandbox",
};

async function getArtContents(): Promise<Content[]> {
  try {
    const key = process.env.BEHANCE_API_KEY;
    const behanceUrl = `https://api.behance.net/v2/users/greenbauer/projects?client_id=${key}`;
    const { projects } = await get(behanceUrl);

    return projects.map((project: any) => {
      const { name, url, covers } = project;

      const content: Content = {
        name,
        galleryUrl: url,
        mediaSources: [
          {
            key: covers.original,
            alt: name,
            type: 'img',
          },
        ],
      };

      return content;
    });
  } catch (error) {
    console.error(error);
  }

  return [];
}

export default async function Art() {
  const contents = await getArtContents();

  return (
    <div className="flex">
      <div className="card-columns">
        {contents.map((content) => (
          <Card key={content.name} content={content} />
        ))}
      </div>
    </div>
  );
}
