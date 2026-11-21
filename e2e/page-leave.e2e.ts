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

  // The page's timers held from the click to Back: the site goes on
  // TILES_MS after the click (leaveTo.ts), and a slow CI runner can take
  // longer than that to get from the click to Back, which then rightly
  // returns to the home page.
  // Paused 30 seconds on from the page's own clock, read after installing
  // it. The margin is wide because on a CI runner drawing WebGL in software
  // the page's main thread can stall for seconds between reading the time
  // and pausing, and a 1-second margin was then already in the past
  // ("Cannot fast-forward to the past"). Fast-forwarding only fires the home
  // page's idle timers, all before the click this test is about.
  await page.clock.install();
  await page.clock.pauseAt(await page.evaluate(() => Date.now() + 30_000));
  await page
    .getByRole('navigation', { name: 'Main' })
    .getByRole('link', { name: 'Contact' })
    .click();
  await expect(page.locator('body')).toHaveAttribute('data-leaving', '');
  // The browser's own Back, to the entry before: a script's history.back()
  // may skip an entry the page added long after a click (as a slow CI
  // runner's can), which no visitor's Back button does.
  await page.goBack({ waitUntil: 'commit' });
  await expect(page).toHaveURL(/\/portfolio\/web-apps$/);
  // The timers run again, well past the moment the site would have gone on.
  await page.clock.resume();
  await page.waitForTimeout(2500);
  await expect(page).toHaveURL(/\/portfolio\/web-apps$/);
  await expect(page.locator('[data-post]').first()).toBeVisible();
});
