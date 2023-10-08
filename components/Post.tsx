'use client';

import { Element } from 'react-scroll';

import Button from '@/components/Button';
import { Content } from '@/types';
import { setMenuId } from '@/utils/menu';

import Media from './Media';

type PostProps = { content: Content };

export default function Post({ content }: PostProps) {
  const {
    name,
    mediaSources,
    description,
    technology,
    siteUrl,
    repositoryUrl,
  } = content;

  return (
    <section>
      <Element name={setMenuId(name)} className="scroll-element" />
      <div className="flex w-full flex-wrap">
        {!!mediaSources && <Media mediaSources={mediaSources} />}
        <article className="flex flex-col gap-3 md:gap-6">
          <h2>{name}</h2>
          {!!description && <span>{description}</span>}
          {!!technology && (
            <p>
              Technology used:
              <br />
              <small>{technology}</small>
            </p>
          )}
          {!!siteUrl && (
            <Button href={siteUrl} target="_blank">
              Visit Site
            </Button>
          )}
          {!!repositoryUrl && (
            <Button href={repositoryUrl} target="_blank">
              View Code
            </Button>
          )}
        </article>
      </div>
    </section>
  );
}
