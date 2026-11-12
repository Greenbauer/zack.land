import { expect as expectNow, Page, test } from '@playwright/test';

// Going to another page of the site, the page first moves out (about a
// second, components/PageLeave.tsx) and then the site goes there. The
// browser's back button pressed meanwhile calls that trip off: the site
// stays where back took it (audit B2). Against a built site:
// `npx playwright test`.

const expect = expectNow.configure({ timeout: 30_000 });

test.use({ viewport: { width: 1280, height: 720 } });

const pageIn = (page: Page) =>
  expect(page.locator('html')).toHaveAttribute('data-page-in', '');

test('back while the page moves out stays where back went', async ({
  page,
}) => {
  await page.goto('/portfolio/web-apps');
  await pageIn(page);
  // To the home page by its header link, so there is a page to go back to.
  await page
    .getByRole('navigation', { name: 'Main' })
    .getByRole('link', { name: 'Home' })
    .click();
  await expect(page).toHaveURL(/\/$/);
  await pageIn(page);

  await page
    .getByRole('navigation', { name: 'Main' })
    .getByRole('link', { name: 'Contact' })
    .click();
  await expect(page.locator('body')).toHaveAttribute('data-leaving', '');
  await page.evaluate(() => history.back());
  await expect(page).toHaveURL(/\/portfolio\/web-apps$/);
  // Well past the moment the site would have gone on (TILES_MS, leaveTo.ts).
  await page.waitForTimeout(2500);
  await expect(page).toHaveURL(/\/portfolio\/web-apps$/);
  await expect(page.locator('[data-post]').first()).toBeVisible();
});
