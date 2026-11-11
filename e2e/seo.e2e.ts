import { expect, test } from '@playwright/test';

import { SITE_URL as SITE } from '../utils/site';

// What a search engine or a link preview reads from each page's served HTML
// (the root layout's metadata, utils/site.ts): no browser runs, so once, in
// Chrome's project. Then the header's dropdown, whose closed pane is in that
// HTML. Against a built site: `npx playwright test e2e/seo`.

const pages = [
  { path: '/', title: 'Zack Greenbauer' },
  { path: '/portfolio/web-apps', title: 'Web Apps - Zack Greenbauer' },
  {
    path: '/portfolio/miscellaneous',
    title: 'Miscellaneous - Zack Greenbauer',
  },
  { path: '/contact', title: 'Contact - Zack Greenbauer' },
];

const meta = (html: string, key: string) =>
  html.match(
    new RegExp(`<meta (?:property|name)="${key}" content="([^"]*)"`),
  )?.[1];

test.describe('the served HTML', () => {
  test.beforeEach(() => {
    test.skip(test.info().project.name !== 'chrome', 'no browser runs');
  });

  for (const { path, title } of pages) {
    test(`${path} names itself in its title and share tags`, async ({
      request,
    }) => {
      const html = await (await request.get(path)).text();
      const url = path === '/' ? SITE : `${SITE}${path}`;
      expect(html).toContain(`<title>${title}</title>`);
      expect(html).toContain(`<link rel="canonical" href="${url}"/>`);
      expect(meta(html, 'og:url')).toBe(url);
      expect(meta(html, 'og:title')).toBe(title);
      expect(meta(html, 'twitter:title')).toBe(title);
      expect(meta(html, 'theme-color')).toBe('#010018');
    });

    test(`${path} links both portfolio pages in its HTML`, async ({
      request,
    }) => {
      const html = await (await request.get(path)).text();
      expect(html).toContain('href="/portfolio/web-apps"');
      expect(html).toContain('href="/portfolio/miscellaneous"');
    });
  }

  test('every page carries the site and its owner as structured data', async ({
    request,
  }) => {
    const html = await (await request.get('/contact')).text();
    const json = html.match(
      /<script type="application\/ld\+json">([^<]*)<\/script>/,
    )?.[1];
    const types = JSON.parse(json!)['@graph'].map(
      (entry: { '@type': string }) => entry['@type'],
    );
    expect(types).toEqual(['WebSite', 'Person']);
  });

  test('/portfolio moves to Web Apps for good', async ({ request }) => {
    const response = await request.get('/portfolio', { maxRedirects: 0 });
    expect(response.status()).toBe(308);
    expect(response.headers().location).toBe('/portfolio/web-apps');
  });

  test('a missing page serves its 404 title', async ({ request }) => {
    const response = await request.get('/no-such-page');
    expect(response.status()).toBe(404);
    expect(await response.text()).toContain(
      '<title>404 - Zack Greenbauer</title>',
    );
  });
});

// The Portfolio dropdown's pane stays in the page while closed, so its links
// are in the HTML. Closed, it must stay out of the way: no glass, no lens
// layer, and no Tab stop.
test.describe('the closed Portfolio dropdown', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('takes no glass and no Tab stop until it opens', async ({ page }) => {
    await page.goto('/contact');
    await page
      .locator('html[data-page-in]')
      .waitFor({ state: 'attached', timeout: 30_000 });
    const pane = page.locator('[data-glass-over]');
    const lens = () =>
      page.evaluate(() =>
        [...document.querySelectorAll<HTMLElement>('[data-photo-lens]')].some(
          (layer) => layer.style.getPropertyValue('--photo-lens') !== '',
        ),
      );
    // In the page, hidden (no box, so no glass: glassCards.ts), and no lens.
    const closed = async () => {
      await expect(pane).toBeAttached();
      await expect(pane).toBeHidden();
      await expect.poll(lens).toBe(false);
    };
    await closed();

    // Tab from the top passes Home, Portfolio and Contact, and never a
    // portfolio link. (WebKit, like Safari, skips links without Option.)
    const tab = test.info().project.name === 'webkit' ? 'Alt+Tab' : 'Tab';
    const focused: (string | null)[] = [];
    for (let i = 0; i < 6; i++) {
      await page.keyboard.press(tab);
      focused.push(
        await page.evaluate(() => document.activeElement!.getAttribute('href')),
      );
    }
    expect(focused).not.toContain('/portfolio/web-apps');
    expect(focused).not.toContain('/portfolio/miscellaneous');

    // Opened, it takes its lens layer; closed again, it lets it go.
    await page.locator('[data-nav-dropdown]').click();
    await expect(pane.getByRole('link', { name: 'Web Apps' })).toBeVisible();
    await expect.poll(lens).toBe(true);
    await page.keyboard.press('Escape');
    await expect(pane).toBeHidden();
    await closed();
  });
});
