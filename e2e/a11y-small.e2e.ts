import { expect as expectNow, Page, test } from '@playwright/test';

// Keyboard and screen reader use of the contact form, the footer, the page
// turns, the loader and the scroll arrows (findings A2 to A15 and B3 of
// docs/audit/2026-11.md). Against a built site: `npx playwright test`.

// A software-drawn runner can take many seconds over a frame.
const expect = expectNow.configure({ timeout: 30_000 });

// Waits until the page is in (the dark screen gone, the cards arrived).
const opened = async (page: Page, path: string) => {
  await page.goto(path);
  await page
    .locator('html[data-page-in]')
    .waitFor({ state: 'attached', timeout: 30_000 });
  await page.waitForTimeout(1500);
};

// WebKit, like Safari, skips links on Tab unless Option is held.
const tabKey = () =>
  test.info().project.name === 'webkit' ? 'Alt+Tab' : 'Tab';

test.describe('the contact form', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('names each field by its label, with its type and autofill', async ({
    page,
  }) => {
    await opened(page, '/contact');
    const name = page.getByLabel('Name');
    const email = page.getByLabel('Email');
    await expect(name).toHaveAttribute('type', 'text');
    await expect(name).toHaveAttribute('autocomplete', 'name');
    await expect(email).toHaveAttribute('type', 'email');
    await expect(email).toHaveAttribute('autocomplete', 'email');
    await expect(page.getByLabel('Message')).toHaveJSProperty(
      'tagName',
      'TEXTAREA',
    );
    // Clicking a label puts the caret in its field.
    await page.getByText('Email', { exact: true }).click();
    await expect(email).toBeFocused();
  });

  test('ties an error to its field, and counts only spaces as empty', async ({
    page,
  }) => {
    await opened(page, '/contact');
    const name = page.getByLabel('Name');
    await expect(name).toHaveAttribute('aria-invalid', 'false');
    await name.fill('   ');
    await page.getByLabel('Email').fill('someone@example.com');
    await page.getByLabel('Message').fill('Hello');
    await expect(name).toHaveAttribute('aria-invalid', 'true');
    await expect(name).toHaveAccessibleDescription('required');
    await expect(page.getByRole('button', { name: 'Submit' })).toBeDisabled();
    await name.fill('Someone');
    await expect(name).toHaveAttribute('aria-invalid', 'false');
    await expect(page.getByRole('button', { name: 'Submit' })).toBeEnabled();
  });

  // Submits a filled form while its answer is held, then answers `status`.
  const sends = async (page: Page, status: 200 | 500, text: string) => {
    let release = () => {};
    const answered = new Promise<void>((resolve) => (release = resolve));
    await page.route('/api/email', async (route) => {
      await answered;
      await route.fulfill({ status, json: { ok: status === 200 } });
    });
    await opened(page, '/contact');
    await page.getByLabel('Name').fill('Someone');
    await page.getByLabel('Email').fill('someone@example.com');
    await page.getByLabel('Message').fill('Hello');
    await page.getByRole('button', { name: 'Submit' }).focus();
    await page.keyboard.press('Enter');

    const region = page.getByRole('status').filter({ hasNotText: 'Loading' });
    await expect(region).toHaveText('Sending your message');
    // The button stays, with focus, while it sends.
    await expect(page.getByRole('button', { name: 'Submit' })).toBeFocused();

    release();
    await expect(region).toHaveText(text);
    if (status === 200) await expect(region).toBeFocused();
    else
      await expect(page.getByRole('button', { name: 'Submit' })).toBeFocused();
  };

  test('says it is sending, then sent, keeping focus', ({ page }) =>
    sends(page, 200, 'Your message has been sent'));

  test('says it is sending, then refused, keeping focus', ({ page }) =>
    sends(page, 500, 'An error has occurred'));
});

test.describe('the contact form, pressed twice', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('sends once and waits for the answer', async ({ page }) => {
    let release = () => {};
    const answered = new Promise<void>((resolve) => (release = resolve));
    let requests = 0;
    await page.route('/api/email', async (route) => {
      requests += 1;
      await answered;
      await route.fulfill({ status: 500, json: { ok: false } });
    });
    await opened(page, '/contact');
    await page.getByLabel('Name').fill('Someone');
    await page.getByLabel('Email').fill('someone@example.com');
    await page.getByLabel('Message').fill('Hello');
    const submit = page.getByRole('button', { name: 'Submit' });
    await submit.click();
    const region = page.getByRole('status').filter({ hasNotText: 'Loading' });
    await expect(region).toHaveText('Sending your message');
    // A real press still reaches it (it is only aria-disabled); Playwright
    // would wait for it to be enabled, so the press is forced.
    await submit.click({ force: true });
    await page.getByLabel('Name').press('Enter');
    await page.waitForTimeout(500);
    // Still sending: no result yet, and one request.
    await expect(region).toHaveText('Sending your message');
    expect(requests).toBe(1);
    release();
    await expect(region).toHaveText('An error has occurred');
    await expect(submit).toBeVisible();
  });
});

test('the footer names its social links', async ({ page }) => {
  await opened(page, '/');
  for (const name of ['GitHub', 'X', 'LinkedIn'])
    await expect(page.getByRole('link', { name, exact: true })).toBeVisible();
});

test('the loading status is gone once the page is in', async ({ page }) => {
  await opened(page, '/');
  await expect(page.getByRole('status', { name: 'Loading' })).toBeHidden();
});

test.describe('on a wide screen', () => {
  test.use({ viewport: { width: 1280, height: 720 } });

  test('Space presses a focused button rather than turning the page', async ({
    page,
  }) => {
    await opened(page, '/portfolio/web-apps');
    // Banner Eyewear, the second post, has More at this size.
    await page.keyboard.press('ArrowDown');
    const post = page.locator('.post-card').nth(1);
    const more = post.getByRole('button', { name: 'More' });
    await expect(more).toBeVisible();
    const top = () =>
      page.evaluate(() => document.getElementById('page')!.scrollTop);
    await page.waitForTimeout(1500);
    const before = await top();
    await more.focus();
    await page.keyboard.press(' ');
    await expect(post.getByRole('button', { name: 'Less' })).toBeVisible();
    await page.waitForTimeout(1500);
    expect(await top()).toBe(before);
  });

  test('More takes a press a little above and below its text', async ({
    page,
  }) => {
    await opened(page, '/portfolio/web-apps');
    await page.keyboard.press('ArrowDown');
    const more = page
      .locator('.post-card')
      .nth(1)
      .getByRole('button', { name: 'More' });
    await expect(more).toBeVisible();
    await page.waitForTimeout(1500);
    const box = (await more.boundingBox())!;
    const hit = await page.evaluate(
      ({ x, y }) => document.elementFromPoint(x, y)?.textContent,
      { x: box.x + box.width / 2, y: box.y + box.height + 8 },
    );
    expect(hit).toBe('More');
  });

  test('focus by keyboard shows a ring on the header links and fields', async ({
    page,
  }) => {
    await opened(page, '/contact');
    // A header link's ring is drawn inside its padding (NavLink.tsx), on the
    // label's ::after; a field's is its own outline.
    const ring = () =>
      page.evaluate(() => {
        const at = document.activeElement!;
        const label = at.querySelector('[class*="after:outline"]');
        return label
          ? getComputedStyle(label, '::after').outlineColor
          : getComputedStyle(at).outlineColor;
      });
    const none = 'rgba(0, 0, 0, 0)';
    expect(await ring()).toBe(none);
    await page.keyboard.press(tabKey());
    await expect(page.getByRole('link', { name: 'Home' })).toBeFocused();
    expect(await ring()).not.toBe(none);
    await page.keyboard.press(tabKey());
    await expect(page.getByRole('button', { name: 'Portfolio' })).toBeFocused();
    expect(await ring()).not.toBe(none);
    await page.getByLabel('Name').focus();
    expect(await ring()).not.toBe(none);
  });
});

test.describe('with reduced motion', () => {
  test.use({
    viewport: { width: 1280, height: 720 },
    reducedMotion: 'reduce',
  });

  test('the scroll arrows hold still, one chevron showing', async ({
    page,
  }) => {
    await opened(page, '/portfolio/web-apps');
    const chevrons = page.locator('.animate-arrow-l, [class*="arrow-l"]');
    await expect(chevrons.first()).toBeAttached();
    const shown = await chevrons.evaluateAll((all) =>
      all.map((chevron) => ({
        moving: chevron.getAnimations().length > 0,
        opacity: getComputedStyle(chevron).opacity,
        display: getComputedStyle(chevron).display,
      })),
    );
    for (const { moving } of shown) expect(moving).toBe(false);
    const visible = shown.filter(
      ({ display, opacity }) => display !== 'none' && opacity === '1',
    );
    expect(visible.length).toBe(shown.length / 2);
  });
});
