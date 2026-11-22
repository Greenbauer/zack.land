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
      name: "I build AI tools that take one repetitive task off a small team's plate",
    }),
  ).toBeVisible();
  await expect(
    page.getByText(
      'Done for you, checked by a person, and kept running. You approve everything before it goes out.',
    ),
  ).toBeVisible();
  // Both starters, quotes first, each with its pitch, setup fee and monthly
  // fee.
  await expect(page.locator('article h3')).toContainText([
    'Same-day quotes',
    'Stop retyping the same information',
  ]);
  await expect(
    page.getByText(
      'Send a recording or notes from the site walk. A drafted quote comes back for you to check and send.',
    ),
  ).toBeAttached();
  await expect(
    page.getByText(
      'Details from forms, PDFs and emails get entered into your software once, instead of typed into the calendar, the estimate and the invoice.',
    ),
  ).toBeAttached();
  await expect(page.getByText('$3,500 setup')).toHaveCount(2);
  await expect(
    page.getByText('Then $500 a month to keep it running. Ready in two weeks.'),
  ).toHaveCount(2);
  await expect(
    page.getByRole('heading', { name: 'The first two are free' }),
  ).toBeAttached();
  await expect(
    page.getByText(
      'The first two businesses get the setup free. In return, I publish a short write-up of what changed, with your business named.',
    ),
  ).toBeAttached();
  await expect(
    page.getByText(
      'Right now I lead AI agent work at a distribution company.',
      { exact: false },
    ),
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
    .getByLabel('What task do you want off your plate?')
    .fill('Turn site walks into quotes');
  await expect(submit).toBeEnabled();

  await submit.click();
  await expect(page.getByRole('status')).toHaveText(
    "Sent. I'll reply by email.",
  );
  expect(body).toMatchObject({
    kind: 'build',
    email: 'lead@example.com',
    message: 'Turn site walks into quotes',
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
    .getByLabel('What task do you want off your plate?')
    .fill('Turn site walks into quotes');
  const submit = page.getByRole('button', { name: 'Ask about a build' });
  await submit.click();

  await expect(page.getByRole('status')).toHaveText('An error has occurred');
  await expect(submit).toBeVisible();
});

test('the footer speaks to each audience, and here jumps to the form', async ({
  page,
}) => {
  const footer = page.getByRole('contentinfo');

  await opened(page, '/');
  await expect(footer).toContainText(
    'Hiring a developer, or have a task that repeats?',
  );
  await expect(
    footer.getByRole('link', { name: 'Get in touch', exact: true }),
  ).toHaveAttribute('href', '/contact');

  await opened(page, '/work-with-me');
  await expect(footer).toContainText(
    'Have a task your team does over and over?',
  );
  await footer
    .getByRole('link', { name: 'Tell me about it', exact: true })
    .click();
  await expect(page.getByLabel('Your email')).toBeInViewport();
});
