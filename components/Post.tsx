'use client';

import { useState } from 'react';
import { Element } from 'react-scroll';

import Button from '@/components/Button';
import { Content } from '@/types';
import { setMenuId } from '@/utils/menu';

import Media from './Media';
import { galleryLayout } from './postGallery';

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

  const [isExpanded, setIsExpanded] = useState(false);
  const hasMedia = !!mediaSources?.length;
  const gallery = galleryLayout(mediaSources?.length ?? 0);
  // On a phone a post with images shows a few lines of its text and hides the
  // rest behind More, which gives the whole post to the text.
  const isClamped = hasMedia && !isExpanded;

  // Each post fills the space between the page's fades (--post-height, from
  // PageScroller), and the page snaps from post to post: on a wide screen its
  // gallery sits beside its text, on a phone above it.
  return (
    <section className="h-[var(--post-height)] max-w-none snap-start scroll-mt-[var(--page-top)] flex-col overflow-hidden rounded-3xl md:flex-row">
      <Element
        name={setMenuId(name)}
        className="scroll-element absolute top-0"
      />
      {hasMedia && (
        <div
          className={`min-h-0 flex-1 gap-px md:grid md:h-full md:min-w-0 ${
            isExpanded ? 'hidden' : 'grid'
          } ${gallery.grid}`}
        >
          {mediaSources.map((mediaSource, index) => (
            <div
              key={mediaSource.key}
              className={`min-h-0 overflow-hidden ${gallery.cell(index)}`}
            >
              <Media mediaSource={mediaSource} />
            </div>
          ))}
        </div>
      )}
      <article
        className={`flex flex-col gap-2 overflow-y-auto p-5 text-sm md:gap-3 md:p-8 2xl:gap-4 2xl:text-base lg:[&_h2]:text-3xl [&_p]:text-sm [&_p]:leading-5 2xl:[&_p]:text-base 2xl:[&_p]:leading-6 [@media(max-height:800px)]:md:gap-2 [@media(max-height:800px)]:md:p-5 [@media(max-height:800px)]:[&_h2]:text-2xl [@media(max-height:800px)]:[&_p]:text-[13px] [@media(max-height:800px)]:[&_p]:leading-[18px] ${
          hasMedia
            ? `${isExpanded ? 'flex-1' : 'shrink-0'} md:w-80 md:flex-none md:shrink-0 lg:w-[26rem] xl:w-[30rem]`
            : 'flex-1 md:justify-center'
        }`}
      >
        <h2>{name}</h2>
        {!!description && (
          <div className={isClamped ? 'line-clamp-4 md:line-clamp-none' : ''}>
            {description}
          </div>
        )}
        {!!technology && (
          <p className={isClamped ? 'hidden md:block' : ''}>
            Technology used:
            <br />
            <small>{technology}</small>
          </p>
        )}
        {hasMedia && (
          <button
            type="button"
            className="self-start text-sm uppercase tracking-wider text-pink hover:text-yellow md:hidden"
            onClick={() => setIsExpanded(!isExpanded)}
            aria-expanded={isExpanded}
          >
            {isExpanded ? 'Less' : 'More'}
          </button>
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
    </section>
  );
}
