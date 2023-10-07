'use client';

import { Element } from 'react-scroll';

import Button from '@/components/Button';
import { Content } from '@/types';
import { setMenuId } from '@/utils/menu';

import Media from './Media';

type PostProps = { content: Content };

export default function Post({ content }: PostProps) {
  const { name, src, desc, tech, siteUrl, repoUrl } = content;

  return (
    <section>
      <Element name={setMenuId(name)} className="scroll-element" />
      <div className="flex w-full flex-wrap">
        {!!src && <Media sources={src} />}
        <article className="flex flex-col gap-3 md:gap-6">
          <h2>{name}</h2>
          {!!desc && <span>{desc}</span>}
          {!!tech && (
            <p>
              Technology used:
              <br />
              <small>{tech}</small>
            </p>
          )}
          {!!siteUrl && (
            <Button href={siteUrl} target="_blank">
              Visit Site
            </Button>
          )}
          {!!repoUrl && (
            <Button href={repoUrl} target="_blank">
              View Code
            </Button>
          )}
        </article>
      </div>
    </section>
  );
}
