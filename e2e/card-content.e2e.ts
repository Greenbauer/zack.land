import { expect, Page, test } from '@playwright/test';

// What sits on the frosted glass waits for its glass: it fades in as the card
// or the phone menu's pane comes to a stop, not on the way. Read off the
// animations' own timing, so a slow machine doesn't change the answer.
// Against a built site: `npx playwright test`.

test.use({ viewport: { width: 390, height: 844 }, hasTouch: true });

type Timing = { start: number; end: number };

// When the animation `name` of the first element matching `selector` starts
// and ends, in milliseconds from the page's arrival.
const timing = (page: Page, selector: string, name: string) =>
  page.evaluate(
    ({ selector, name }): Timing => {
      const { delay, duration } = document
        .querySelector(selector)!
        .getAnimations()
        .find((a) => (a as CSSAnimation).animationName === name)!
        .effect!.getComputedTiming();
      const length = Number(duration);
      return { start: Number(delay), end: Number(delay) + length };
    },
    { selector, name },
  );

for (const path of ['/contact', '/no-such-page'])
  test(`${path}: its content fades in as the card stops`, async ({ page }) => {
    await page.goto(path);
    await page.waitForSelector('section article');
    const card = await timing(page, 'section', 'card-in');
    const content = await timing(page, 'section article', 'fade-in');
    expect(content.start).toBeGreaterThanOrEqual(0.6 * card.end);
    expect(content.end).toBeLessThanOrEqual(card.end);
  });

test('a post’s content fades in as its card stops', async ({ page }) => {
  await page.goto('/portfolio/web-apps');
  const post = page.locator('section article').first();
  await expect(post).toBeAttached();
  const { delay, duration, slide, slideDelay } = await post.evaluate(
    (article) => {
      const content = getComputedStyle(article);
      const card = getComputedStyle(article.closest('.post-card')!);
      const at = card.transitionProperty.split(', ').indexOf('translate');
      return {
        delay: parseFloat(content.transitionDelay),
        duration: parseFloat(content.transitionDuration),
        slide: parseFloat(card.transitionDuration.split(', ')[at]!),
        slideDelay: parseFloat(card.transitionDelay.split(', ')[at]!),
      };
    },
  );
  expect(delay - slideDelay).toBeGreaterThanOrEqual(0.6 * slide);
  // In seconds, as added up from CSS: a thousandth covers the rounding.
  expect(delay + duration).toBeLessThanOrEqual(slideDelay + slide + 0.001);
});

test('the menu’s links fade in as its pane stops', async ({ page }) => {
  await page.goto('/contact');
  await page.locator('[id^="headlessui-menu-button"]').tap();
  const pane = await timing(page, '.mobile-menu', 'menu-in');
  const links = await timing(page, '[role="menu"]', 'fade-in');
  expect(links.start).toBeGreaterThanOrEqual(0.6 * pane.end);
  expect(links.end).toBeLessThanOrEqual(pane.end);
});
