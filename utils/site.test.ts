import { describe, expect, it } from 'vitest';

import robots from '@/app/robots';
import sitemap from '@/app/sitemap';

import { SITE_URL, SOCIAL_LINKS, structuredData } from './site';

describe('the structured data', () => {
  const [site, person] = structuredData()['@graph'];

  it('names the site and its owner, linked by id', () => {
    expect(site).toMatchObject({ '@type': 'WebSite', url: SITE_URL });
    expect(site.name).toBe('zack.land');
    expect(person).toMatchObject({
      '@type': 'Person',
      name: 'Zack Greenbauer',
    });
    expect(site.publisher).toEqual({ '@id': person['@id'] });
  });

  it('gives the owner an image and every profile the footer links', () => {
    expect(person.image).toBe(`${SITE_URL}/brand/og-image.png`);
    expect(person.sameAs).toEqual(SOCIAL_LINKS.map(({ url }) => url));
  });
});

describe('the sitemap', () => {
  const entries = sitemap();

  it('lists the four pages and nothing Google ignores', () => {
    expect(entries.map(({ url }) => url)).toEqual([
      SITE_URL,
      `${SITE_URL}/portfolio/web-apps`,
      `${SITE_URL}/portfolio/miscellaneous`,
      `${SITE_URL}/contact`,
    ]);
    for (const entry of entries) {
      expect(entry).not.toHaveProperty('changeFrequency');
      expect(entry).not.toHaveProperty('priority');
    }
  });

  it("lists each portfolio page's photos, and no video", () => {
    const webApps = entries[1]!;
    const miscellaneous = entries[2]!;
    // Web Apps has four photos (its videos left out), Miscellaneous eleven.
    expect(webApps.images).toHaveLength(4);
    for (const image of webApps.images!)
      expect(image).toMatch(new RegExp(`^${SITE_URL}/web-apps/[\\w-]+\\.jpg$`));
    expect(webApps.images).toContain(
      `${SITE_URL}/web-apps/glasses-computer.jpg`,
    );
    expect(miscellaneous.images).toHaveLength(11);
    expect(miscellaneous.images).toContain(
      `${SITE_URL}/miscellaneous/shofarD.jpg`,
    );
    expect(entries.flatMap(({ images = [] }) => images).join(' ')).not.toMatch(
      /\.(mp4|mov)\b|CnYKbnzrn4k/,
    );
  });
});

describe('robots.txt', () => {
  it('allows everything, names the sitemap and has no Host line', () => {
    expect(robots()).toEqual({
      rules: { userAgent: '*', allow: '/' },
      sitemap: `${SITE_URL}/sitemap.xml`,
    });
  });
});
