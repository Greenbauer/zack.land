import { expect, test } from '@playwright/test';

// The contact form's Submit button and its field errors
// (app/(root)/contact/Form.tsx, components/FormFields.tsx). Against a built
// site: `npx playwright test e2e/contact-form.e2e.ts`.

test.use({ viewport: { width: 1280, height: 800 } });

test.beforeEach(async ({ page }) => {
  await page.goto('/contact');
});

test('enables Submit once valid, without blurring the last field', async ({
  page,
}) => {
  const submit = page.locator('form button[type="submit"]');
  await expect(submit).toBeDisabled();

  await page.locator('input[name="name"]').fill('Zachary Greenbauer');
  await page.locator('input[name="email"]').fill('zach@example.com');
  // Type into the last field and deliberately do NOT leave it.
  await page
    .locator('textarea[name="message"]')
    .pressSequentially('Hello there');

  // Still in the message field, and Submit is already enabled.
  await expect(page.locator('textarea[name="message"]')).toBeFocused();
  await expect(submit).toBeEnabled();
});

test('shows a field error only after blur, not while typing', async ({
  page,
}) => {
  const email = page.locator('input[name="email"]');
  const error = page.locator('small', { hasText: 'invalid' });
  await email.pressSequentially('not-an-email');
  // While the field is still focused, no error text yet.
  await expect(error).toHaveCount(0);

  await email.blur();
  await expect(error).toBeVisible();
});

test('keeps the button readable on hover while it is focused', async ({
  page,
}) => {
  await page.locator('input[name="name"]').fill('Ada Lovelace');
  await page.locator('input[name="email"]').fill('ada@example.com');
  await page.locator('textarea[name="message"]').fill('Hello there');
  const submit = page.locator('form button[type="submit"]');
  await expect(submit).toBeEnabled();
  // The text colour on each side of the sky, set and read in one step since
  // the site sets the side itself as the sky changes.
  const colour = (sky: string) =>
    submit.evaluate((button, side) => {
      button.style.transition = 'none';
      button.closest('section')!.setAttribute('data-sky', side);
      return getComputedStyle(button).color;
    }, sky);
  for (const sky of ['dark', 'light']) {
    await submit.evaluate((button: HTMLButtonElement) => button.blur());
    await page.mouse.move(5, 5);
    const rest = await colour(sky);
    await submit.focus();
    expect(await colour(sky), `focused, ${sky}`).toBe(rest);
    await submit.hover();
    const focused = await colour(sky);
    await submit.evaluate((button: HTMLButtonElement) => button.blur());
    const hovered = await colour(sky);
    expect(hovered, `hovered, ${sky}`).not.toBe(rest);
    expect(focused, `hovered while focused, ${sky}`).toBe(hovered);
  }
});
