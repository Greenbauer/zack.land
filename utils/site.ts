// The site's own facts, in one place: its address, name and description, and
// the owner's profiles elsewhere. The root layout's metadata and structured
// data, robots.txt, the sitemap and the footer's links read them from here.

export const SITE_URL = 'https://www.zack.land';
export const SITE_NAME = 'zack.land';
export const OWNER_NAME = 'Zack Greenbauer';
export const SITE_DESCRIPTION = "Zack Greenbauer's Portfolio and Sandbox";

// In the order the footer shows them.
export const SOCIAL_LINKS = [
  { name: 'GitHub', url: 'https://github.com/Greenbauer' },
  { name: 'X', url: 'https://x.com/greenbauer' },
  { name: 'LinkedIn', url: 'https://www.linkedin.com/in/greenbauer' },
] as const;

// The image the site's share tags and its Person entry use.
export const SITE_IMAGE = '/brand/og-image.png';

// The structured data on every page: the site (the entry Google reads the
// site's name from) and its owner, linked to each other by id.
export function structuredData() {
  const person = `${SITE_URL}/#person`;
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': `${SITE_URL}/#website`,
        url: SITE_URL,
        name: SITE_NAME,
        alternateName: OWNER_NAME,
        description: SITE_DESCRIPTION,
        inLanguage: 'en-US',
        publisher: { '@id': person },
      },
      {
        '@type': 'Person',
        '@id': person,
        name: OWNER_NAME,
        url: SITE_URL,
        description: SITE_DESCRIPTION,
        image: `${SITE_URL}${SITE_IMAGE}`,
        sameAs: SOCIAL_LINKS.map(({ url }) => url),
      },
    ] as const,
  };
}
