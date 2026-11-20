import { expect as expectNow, Page, test } from '@playwright/test';

// The Work with me page (app/(root)/work-with-me): reached from the header,
// it shows the offer and its price, and its two-field form posts a build
// request to /api/email. Against a built site: `npx playwright test
// e2e/work-with-me`.

// A software-drawn runner can take many seconds over a frame.
const expect = expectNow.configure({ timeout: 30_000 });

test.use({ viewport: { width: 1280, height: 800 } });

const opened = async (page: Page, path: string) => {
  await page.goto(path);
  await page
    .locator('html[data-page-in]')
    .waitFor({ state: 'attached', timeout: 30_000 });
  await page.waitForTimeout(1500);
};

test('the header links to the page, which shows the offer and its price', async ({
  page,
}) => {
  await opened(page, '/');
  await page.getByRole('link', { name: 'Work with me', exact: true }).click();
  await page.waitForURL('**/work-with-me');

  await expect(page.locator('h1')).toHaveText('Work With Me', {
    ignoreCase: true,
  });
  await expect(
    page.getByRole('heading', {
      name: 'I help software teams get real work out of AI coding agents',
    }),
  ).toBeVisible();
  await expect(page.getByText('$7,500 fixed')).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'The first two are free' }),
  ).toBeAttached();
  await expect(
    page.getByRole('link', { name: 'Vibe Verifier on GitHub' }),
  ).toHaveAttribute('href', 'https://github.com/Greenbauer/vibe-verifier');
});

test('sends a build request with the email and the answer, then says so', async ({
  page,
}) => {
  let body: Record<string, unknown> = {};
  await page.route('/api/email', async (route) => {
    body = route.request().postDataJSON();
    await route.fulfill({ json: { message: 'Email sent successfully' } });
  });
  await opened(page, '/work-with-me');

  const submit = page.getByRole('button', { name: 'Ask about a build' });
  await expect(submit).toBeDisabled();
  await page.getByLabel('Your email').fill('lead@example.com');
  await expect(submit).toBeDisabled();
  await page
    .getByLabel('What do you want your agents to do?')
    .fill('Review our pull requests');
  await expect(submit).toBeEnabled();

  await submit.click();
  await expect(page.getByRole('status')).toHaveText(
    "Sent. I'll reply by email.",
  );
  expect(body).toMatchObject({
    kind: 'build',
    email: 'lead@example.com',
    message: 'Review our pull requests',
  });
  expect(body).not.toHaveProperty('name');
});

test('says so when the request fails, keeping the button', async ({ page }) => {
  await page.route('/api/email', (route) =>
    route.fulfill({ status: 500, json: { error: 'Failed to send email' } }),
  );
  await opened(page, '/work-with-me');

  await page.getByLabel('Your email').fill('lead@example.com');
  await page
    .getByLabel('What do you want your agents to do?')
    .fill('Review our pull requests');
  const submit = page.getByRole('button', { name: 'Ask about a build' });
  await submit.click();

  await expect(page.getByRole('status')).toHaveText('An error has occurred');
  await expect(submit).toBeVisible();
});
