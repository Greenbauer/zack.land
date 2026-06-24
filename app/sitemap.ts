import { MetadataRoute } from 'next';

const SITE_URL = 'https://www.zack.land';

const routes = [
  '',
  '/portfolio',
  '/portfolio/web-apps',
  '/portfolio/art',
  '/portfolio/miscellaneous',
  '/contact',
];

export default function sitemap(): MetadataRoute.Sitemap {
  return routes.map((route) => ({
    url: `${SITE_URL}${route}`,
    changeFrequency: 'monthly',
    priority: route === '' ? 1 : 0.7,
  }));
}
