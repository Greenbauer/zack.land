import { expect, test } from '@playwright/test';

// What sits on the frosted glass fades slowly and evenly for as long as its
// card slides, in or out, starting with it. Read off the animations' own
// timing, so a slow machine doesn't change the answer. Against a built site:
// `npx playwright test`.

test.use({ viewport: { width: 1280, height: 720 } });

for (const path of ['/contact', '/no-such-page'])
  test(`${path}: its content fades in with the card's whole slide`, async ({
    page,
  }) => {
    await page.goto(path);
    await page.waitForSelector('section article');
    const { card, content } = await page.evaluate(() => {
      const timing = (selector: string, name: string) => {
        const { delay, duration } = document
          .querySelector(selector)!
          .getAnimations()
          .find((a) => (a as CSSAnimation).animationName === name)!
          .effect!.getComputedTiming();
        return { delay, duration };
      };
      return {
        card: timing('section', 'card-in'),
        content: timing('section article', 'fade-in'),
      };
    });
    expect(content.delay).toBe(card.delay);
    expect(content.duration).toBe(card.duration);
  });

test('a post’s content fades with its card’s whole slide, in and out', async ({
  page,
}) => {
  await page.goto('/portfolio/web-apps');
  await page.waitForTimeout(2600);
  const timing = (index: number) =>
    page
      .locator('.post-card')
      .nth(index)
      .evaluate((card) => {
        const style = getComputedStyle(card);
        const at = style.transitionProperty.split(', ').indexOf('translate');
        const content = getComputedStyle(card.querySelector('article')!);
        return {
          slide: parseFloat(style.transitionDuration.split(', ')[at]!),
          wait: parseFloat(style.transitionDelay.split(', ')[at]!),
          fade: parseFloat(content.transitionDuration),
          fadeWait: parseFloat(content.transitionDelay),
        };
      });

  const arrived = await timing(0);
  expect(arrived.fade).toBe(arrived.slide);
  expect(arrived.fadeWait).toBe(arrived.wait);

  await page.keyboard.press('ArrowDown');
  await expect(page.locator('.post-card').first()).toHaveClass(/invisible/);
  const left = await timing(0);
  expect(left.fade).toBe(left.slide);
  expect(left.fadeWait).toBe(0);
  expect(left.wait).toBe(0);
});

test('going to another page, a card’s content fades for as long as it slides', async ({
  page,
}) => {
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
      return { delay, duration };
    };
    return { fade: timing(section.children[0]!), card: timing(section) };
  });
  expect(fade).toEqual(card);
  expect(card.delay).toBe(0);
});

for (const [name, width, height] of [
  ['a desktop', 1280, 720],
  ['a phone', 390, 844],
] as const)
  test(`on ${name}, a post’s card keeps its colours as the page turns`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height });
    await page.goto('/portfolio/web-apps');
    await page.waitForFunction(() => sessionStorage.getItem('sky-station'));
    // Until the sky's side is settled, a card reads the sky around it.
    await page.waitForTimeout(2600);
    await page.evaluate(() => {
      const card = document.querySelector('.post-card')!;
      const sides: (string | null)[] = [];
      Object.assign(window, { sides });
      const step = () => {
        sides.push(card.getAttribute('data-sky'));
        requestAnimationFrame(step);
      };
      step();
    });
    await page.keyboard.press('PageDown');
    await expect(page.locator('.post-card').first()).toHaveClass(/invisible/);
    await page.waitForTimeout(900);

    const sides = await page.evaluate(
      () => (window as unknown as { sides: string[] }).sides,
    );
    expect(sides.length).toBeGreaterThan(1);
    expect(new Set(sides).size).toBe(1);
  });
