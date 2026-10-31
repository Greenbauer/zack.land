import { expect, Page, test } from '@playwright/test';

// Choosing a page in the phone menu (components/Header/MobileNav): the page it
// leaves never comes back, the menu stays until the next page is in and then
// fades away evenly, and the sky sets off with the tap, ahead of the next
// page; and so it does for a link or the browser's back, and with the scroll
// for a post turn. Against a built site: `npx playwright test`.

test.use({ viewport: { width: 390, height: 844 }, hasTouch: true });

// The sky has its first home once the scene is up.
const sceneUp = (page: Page) =>
  page.waitForFunction(() => sessionStorage.getItem('sky-station'));

const openMenu = async (page: Page) => {
  await sceneUp(page);
  await page.locator('[id^="headlessui-menu-button"]').tap();
  await expect(page.locator('.mobile-menu.fixed')).toBeVisible();
  // Where the slide in ends, so the tap finds its link.
  await page.waitForFunction(() =>
    document
      .querySelector('.mobile-menu')!
      .getAnimations()
      .every(({ playState }) => playState === 'finished'),
  );
};

type Step = {
  path: string;
  menu: 'open' | 'closing' | 'closed';
  pageShows: boolean;
  sky: string | null;
  // The colour the header's text is turning to.
  ink: string;
  // The ink the page's card shows now, if it has one.
  card: string;
};

// What the page shows, frame by frame, from here on.
const record = (page: Page) =>
  page.evaluate(() => {
    const steps: Step[] = [];
    Object.assign(window, { steps });
    const step = () => {
      const pane = document.querySelector('.mobile-menu')!;
      steps.push({
        path: location.pathname,
        menu: pane.classList.contains('fixed')
          ? 'open'
          : pane.classList.contains('hidden')
            ? 'closed'
            : 'closing',
        pageShows:
          getComputedStyle(document.getElementById('page')!).visibility !==
          'hidden',
        sky: sessionStorage.getItem('sky-station'),
        ink: document
          .querySelector<HTMLElement>('[data-site-chrome] .sky-colours')!
          .style.getPropertyValue('--sky-text'),
        card: document.querySelector('section')
          ? getComputedStyle(
              document.querySelector('section')!,
            ).getPropertyValue('--card-ink')
          : 'none',
      });
      requestAnimationFrame(step);
    };
    step();
  });
const steps = (page: Page) =>
  page.evaluate(() => (window as unknown as { steps: Step[] }).steps);

// What the sky has been told as the view changes, read as it hears (`event`):
// its station, and where the page is then.
const watchSky = (page: Page, event: string) =>
  page.evaluate((event) => {
    addEventListener(event, () =>
      Object.assign(window, {
        heard: {
          path: location.pathname,
          top: document.getElementById('page')!.scrollTop,
          sky: sessionStorage.getItem('sky-station'),
        },
      }),
    );
  }, event);
const heard = (page: Page) =>
  page.evaluate(
    () =>
      (
        window as unknown as {
          heard: { path: string; top: number; sky: string };
        }
      ).heard,
  );
const skyNow = (page: Page) =>
  page.evaluate(() => sessionStorage.getItem('sky-station'));

test('the page a menu link leaves never comes back', async ({ page }) => {
  await page.goto('/contact');
  await openMenu(page);
  await record(page);
  await page.locator('.mobile-menu a', { hasText: 'Home' }).tap();
  await page.waitForURL('/');
  await expect
    .poll(async () => (await steps(page)).at(-1))
    .toMatchObject({ menu: 'closed', pageShows: true });

  const seen = await steps(page);
  // The old page stays hidden, the menu open over it, until the new one is in.
  const onOldPage = seen.filter(({ path }) => path === '/contact');
  expect(onOldPage.length).toBeGreaterThan(0);
  for (const { menu, pageShows } of onOldPage) {
    expect(menu).toBe('open');
    expect(pageShows).toBe(false);
  }
  // Then it fades away, over the new page.
  expect(seen.some(({ menu }) => menu === 'closing')).toBe(true);
  expect(
    seen.filter(({ menu }) => menu === 'closing').every((s) => s.pageShows),
  ).toBe(true);
});

test('the sky sets off with the tap, ahead of the next page', async ({
  page,
}) => {
  await page.goto('/contact');
  await openMenu(page);
  const before = await skyNow(page);
  // Read as the sky hears of it: the next page can be in by the next frame.
  await watchSky(page, 'sky-view-bound');
  await page.locator('.mobile-menu a', { hasText: 'Home' }).tap();
  await page.waitForURL('/');

  const { path, sky } = await heard(page);
  expect(path).toBe('/contact');
  expect(sky).not.toBe(before);
});

// On a page on a dark sky (the stations after the three light ones), with its
// side settled, so a change of view ends on a light sky. A reload always
// crosses to the other side (skyViews.ts).
const onDarkSky = async (page: Page, path: string) => {
  await page.goto(path);
  await sceneUp(page);
  const first = await skyNow(page);
  if (Number(first) < 3) {
    await page.reload();
    await page.waitForFunction(
      (first) => sessionStorage.getItem('sky-station') !== first,
      first,
    );
  }
  // The header's text follows the view's side only once that is settled.
  await page.locator('html[data-sky-settled]').waitFor({ state: 'attached' });
};

test('text turns with the sky, not after it lands', async ({ page }) => {
  // The menu's dark glass would otherwise keep this text light until it had
  // gone.
  await onDarkSky(page, '/contact');
  await openMenu(page);
  await record(page);
  await page.locator('.mobile-menu a', { hasText: 'Home' }).tap();
  await page.waitForURL('/');
  await expect
    .poll(async () => (await steps(page)).at(-1)?.menu)
    .toBe('closed');

  const seen = await steps(page);
  const turned = seen.find(({ ink }) => ink !== seen[0]!.ink);
  expect(turned?.menu).not.toBe('closed');
  expect(turned?.menu).toBeDefined();
});

test('a card arrives in the new sky’s colours, with no fade to them', async ({
  page,
}) => {
  await onDarkSky(page, '/');
  await openMenu(page);
  await record(page);
  await page.locator('.mobile-menu a', { hasText: 'Contact' }).tap();
  await page.waitForURL('/contact');
  await expect
    .poll(async () => (await steps(page)).at(-1)?.menu)
    .toBe('closed');

  const seen = await steps(page);
  expect(Number(seen.at(-1)!.sky)).toBeLessThan(3);
  const inks = new Set(
    seen.map(({ card }) => card).filter((card) => card !== 'none'),
  );
  // One ink from its first frame on: the light side's, not the default.
  expect(inks.size).toBe(1);
  expect([...inks][0]).not.toBe(
    await page.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue('--card-ink'),
    ),
  );
});

test('a portfolio page keeps the sky it set off with', async ({ page }) => {
  await page.goto('/contact');
  await openMenu(page);
  await record(page);
  await page.locator('.mobile-menu button', { hasText: 'Portfolio' }).tap();
  await page.locator('.mobile-menu a', { hasText: 'Web Apps' }).tap();
  await page.waitForURL('/portfolio/web-apps');
  await expect(page.locator('.mobile-menu.hidden')).toBeAttached();
  await page.waitForTimeout(500);

  const skies = new Set((await steps(page)).map(({ sky }) => sky));
  expect(skies.size).toBe(2);
});

test('the menu closes at once with reduced motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/contact');
  await openMenu(page);
  await record(page);
  await page.locator('.mobile-menu a', { hasText: 'Home' }).tap();
  await page.waitForURL('/');
  await expect(page.locator('.mobile-menu.hidden')).toBeAttached();

  const seen = await steps(page);
  expect(seen.some(({ menu }) => menu === 'closing')).toBe(false);
  expect(
    seen.filter(({ path }) => path === '/contact').some((s) => s.pageShows),
  ).toBe(false);
});

test('the menu button fades the menu away and reopens it on its links', async ({
  page,
}) => {
  await page.goto('/contact');
  await openMenu(page);
  await page.locator('.mobile-menu button', { hasText: 'Portfolio' }).tap();
  await expect(page.locator('.mobile-menu a')).toHaveCount(2);
  await record(page);
  await page.locator('[id^="headlessui-menu-button"]').tap();
  await expect(page.locator('.mobile-menu.hidden')).toBeAttached();
  expect((await steps(page)).some(({ menu }) => menu === 'closing')).toBe(true);

  await openMenu(page);
  await expect(
    page.locator('.mobile-menu button', { hasText: 'Portfolio' }),
  ).toBeVisible();
});

test('the menu fades evenly, leaving no tint for a sudden end', async ({
  page,
}) => {
  await page.goto('/contact');
  await openMenu(page);
  // Read as the fade starts: on a busy page it can be over before a later look.
  const halfway = page.evaluate(
    () =>
      new Promise<number>((resolve) => {
        const pane = document.querySelector<HTMLElement>('.mobile-menu')!;
        pane.addEventListener('animationstart', () => {
          const [fade] = pane.getAnimations();
          fade!.pause();
          fade!.currentTime = 250;
          resolve(parseFloat(getComputedStyle(pane).opacity));
        });
      }),
  );
  await page.locator('[id^="headlessui-menu-button"]').tap();
  expect(await halfway).toBeLessThan(0.5);
});

test.describe('at a desktop size', () => {
  test.use({ viewport: { width: 1280, height: 720 }, hasTouch: false });

  test('the sky sets off with a post turn’s scroll, not its key', async ({
    page,
  }) => {
    await page.goto('/portfolio/web-apps');
    await sceneUp(page);
    // The first card is still arriving for a moment (turnGate).
    await page.waitForTimeout(1600);
    await page.evaluate(() => {
      const scroller = document.getElementById('page')!;
      const start = sessionStorage.getItem('sky-station');
      const step = () => {
        if (sessionStorage.getItem('sky-station') === start)
          return requestAnimationFrame(step);
        Object.assign(window, { skyMovedAt: scroller.scrollTop });
      };
      step();
    });
    await page.keyboard.press('ArrowDown');
    await expect
      .poll(() =>
        page.evaluate(
          () => (window as unknown as { skyMovedAt?: number }).skyMovedAt ?? 0,
        ),
      )
      .toBeGreaterThan(0);
  });

  test('the sky sets off as a link is clicked, ahead of the next page', async ({
    page,
  }) => {
    await page.goto('/contact');
    await sceneUp(page);
    const before = await skyNow(page);
    await watchSky(page, 'sky-view-bound');
    await page.locator('a[href="/"]').first().click();
    await expect.poll(() => heard(page)).toBeTruthy();

    const { sky, path } = await heard(page);
    expect(path).toBe('/contact');
    expect(sky).not.toBe(before);
    await page.waitForURL('/');
    expect(await skyNow(page)).toBe(sky);
  });

  test('the sky sets off as the browser goes back', async ({ page }) => {
    await page.goto('/contact');
    await sceneUp(page);
    await page.locator('a[href="/"]').first().click();
    await page.waitForURL('/');
    const before = await skyNow(page);
    await watchSky(page, 'popstate');
    await page.goBack();
    await expect.poll(() => heard(page)).toBeTruthy();

    const { sky, path } = await heard(page);
    expect(path).toBe('/contact');
    expect(sky).not.toBe(before);
  });
});
