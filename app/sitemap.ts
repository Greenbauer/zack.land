import { MetadataRoute } from 'next';

import { PORTFOLIO_PAGES } from '@/app/(root)/portfolio/pages';
import { SITE_URL } from '@/utils/site';

// Every page, and for each portfolio page the photos its posts show (their
// videos and YouTube films are left out: a sitemap's video entry needs a
// title, a description and a thumbnail of its own).
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: SITE_URL },
    ...PORTFOLIO_PAGES.map(({ path, contents }) => ({
      url: `${SITE_URL}${path}`,
      images: contents.flatMap(({ mediaSources = [] }) =>
        mediaSources
          .filter(({ type }) => type === 'img')
          .map(({ key }) => `${SITE_URL}${key}`),
      ),
    })),
    { url: `${SITE_URL}/contact` },
  ];
}
