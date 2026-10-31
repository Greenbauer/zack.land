import { expect, Page, test } from '@playwright/test';

// What sits on the frosted glass waits for its glass: it fades in as the card
// or the phone menu's pane comes to a stop, not on the way, and going, it fades
// out before the card sets off. Read off the animations' own timing, so a slow
// machine doesn't change the answer.
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

test('going to another page, a card’s content fades before it sets off', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto('/contact');
  await page.waitForTimeout(1600);
  await page.locator('a[href="/"]').first().click({ noWaitAfter: true });
  const { fade, card } = await page.evaluate(() => {
    const section = document.querySelector('section')!;
    const timing = (element: Element) => {
      const { delay, duration } = element
        .getAnimations()
        .at(-1)!
        .effect!.getComputedTiming();
      return { delay: Number(delay), duration: Number(duration) };
    };
    return { fade: timing(section.children[0]!), card: timing(section) };
  });
  expect(fade.duration).toBeLessThanOrEqual(card.delay + 150);
  expect(card.delay).toBeGreaterThan(0);
});

test('a post’s content fades before its card sets off', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto('/portfolio/web-apps');
  await page.waitForTimeout(2600);
  await page.keyboard.press('ArrowDown');
  // The first post has left: its classes are now the leaving ones.
  await expect(page.locator('.post-card').first()).toHaveClass(/invisible/);
  const { fade, wait } = await page
    .locator('.post-card')
    .first()
    .evaluate((card) => {
      const style = getComputedStyle(card);
      const at = style.transitionProperty.split(', ').indexOf('translate');
      return {
        wait: parseFloat(style.transitionDelay.split(', ')[at]!),
        fade: parseFloat(
          getComputedStyle(card.querySelector('article')!).transitionDuration,
        ),
      };
    });
  expect(wait).toBeGreaterThan(0);
  expect(fade).toBeLessThanOrEqual(wait + 0.15);
});

test('closing, the menu’s links fade before its pane is gone', async ({
  page,
}) => {
  await page.goto('/contact');
  const button = page.locator('[id^="headlessui-menu-button"]');
  await button.tap();
  await page.waitForTimeout(1000);
  await button.tap();
  const pane = await timing(page, '.mobile-menu', 'menu-out');
  const links = await timing(page, '[role="menu"]', 'fade-out');
  expect(links.end).toBeLessThanOrEqual(0.5 * pane.end);
});
