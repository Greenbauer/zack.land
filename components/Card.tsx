import Button from '@/components/Button';
import { Content } from '@/types';

import Media from './Media';

type CardProps = { content: Content };

export default function Card({ content }: CardProps) {
  const { name, galleryUrl, mediaSources } = content;

  return (
    <div className="bg-gray-darkest mb-3 inline-block w-full shadow-xl md:mb-6">
      {!!mediaSources && <Media mediaSources={mediaSources} />}
      <div className="-mt-1 flex flex-col items-start gap-3 p-6 md:-mt-2 md:gap-6 lg:p-12">
        <h2>{name}</h2>
        {!!galleryUrl && (
          <Button href={galleryUrl} target="_blank">
            View Gallery
          </Button>
        )}
      </div>
    </div>
  );
}
