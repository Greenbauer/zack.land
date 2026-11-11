import { expect as expectNow, Page, test } from '@playwright/test';

// The phone menu by keyboard, the pages' headings and landmarks, focus and an
// announcement on a page turn, the scene held still with reduced motion, and
// the titles in a forced-colours mode (findings A1, A5, A7, A9, A14 and E4 of
// docs/audit/2026-11.md). Against a built site: `npx playwright test`.

// A software-drawn runner can take many seconds over a frame.
const expect = expectNow.configure({ timeout: 30_000 });

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

const focusedName = (page: Page) =>
  page.evaluate(() => {
    const at = document.activeElement!;
    return at.getAttribute('aria-label') ?? at.textContent?.trim() ?? '';
  });

test.describe('the phone menu', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test('opens, walks and closes by keyboard', async ({ page }) => {
    await opened(page, '/contact');
    const menu = page.getByRole('button', { name: 'Menu', exact: true });
    await page.keyboard.press(tabKey());
    await expect(menu).toBeFocused();
    await expect(menu).toHaveAttribute('aria-expanded', 'false');

    await page.keyboard.press('Enter');
    await expect(menu).toHaveAttribute('aria-expanded', 'true');
    await expect(page.locator('.mobile-menu.fixed')).toBeVisible();
    const stops = [];
    for (let i = 0; i < 3; i++) {
      await page.keyboard.press(tabKey());
      stops.push(await focusedName(page));
    }
    expect(stops).toEqual(['Home', 'Portfolio', 'Contact']);

    // Portfolio turns the menu to its pages, focus on the way back.
    await page.keyboard.press(`Shift+${tabKey()}`);
    await page.keyboard.press('Enter');
    await expect(page.locator('.mobile-menu a')).toHaveCount(2);
    expect(await focusedName(page)).toContain('Portfolio');
    await page.keyboard.press(tabKey());
    expect(await focusedName(page)).toBe('Web Apps');
    await page.keyboard.press(`Shift+${tabKey()}`);
    await page.keyboard.press('Enter');
    expect(await focusedName(page)).toBe('Portfolio');

    await page.keyboard.press('Escape');
    await expect(menu).toHaveAttribute('aria-expanded', 'false');
    await expect(menu).toBeFocused();
  });
});

for (const [path, title] of [
  ['/', "Zack Greenbauer's"],
  ['/portfolio/web-apps', 'Web Apps'],
  ['/portfolio/miscellaneous', 'Miscellaneous'],
  ['/contact', 'Contact Me'],
  ['/no-such-page', '404 - Page not found'],
] as const)
  test(`${path} has one h1, a header and a main navigation`, async ({
    page,
  }) => {
    await page.goto(path);
    const h1 = page.locator('h1');
    await expect(h1).toHaveCount(1);
    await expect(h1).toHaveText(title, { ignoreCase: true });
    // Without the h1 rule's background, which, clipped to see-through text,
    // drew a dark copy of the header's title over its 3D letters.
    await expect(h1).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
    await expect(h1).toHaveCSS('background-image', 'none');
    await expect(page.getByRole('banner')).toHaveCount(1);
    await expect(page.getByRole('navigation', { name: 'Main' })).toBeAttached();
    // No heading stands for a link or the footer's line.
    await expect(page.locator('header :is(h2, h3, h4, h5, h6)')).toHaveCount(0);
    await expect(
      page.locator('footer :is(h1, h2, h3, h4, h5, h6)'),
    ).toHaveCount(0);
  });

test.describe('a page turn', () => {
  test.use({ viewport: { width: 1280, height: 720 } });

  const status = (page: Page) => page.locator('#page-turn-status');

  test('by a key or an arrow focuses and names the post it lands on', async ({
    page,
  }) => {
    await opened(page, '/portfolio/web-apps');
    const titles = await page.locator('[data-post-title]').allTextContents();
    expect(titles).toHaveLength(4);
    const arrived = async (k: number) => {
      await expect(status(page)).toHaveText(`${titles[k]}, ${k + 1} of 4`);
      await expect(
        page.getByRole('heading', { name: titles[k], exact: true }),
      ).toBeFocused();
    };
    await page.keyboard.press('ArrowDown');
    await arrived(1);
    // From the title, the keys still turn the page.
    await page.waitForTimeout(1500);
    await page.keyboard.press('ArrowDown');
    await arrived(2);
    await page.waitForTimeout(1500);
    await page.getByRole('button', { name: 'Scroll down' }).click();
    await arrived(3);
  });

  test('by the wheel moves no focus and says nothing', async ({ page }) => {
    await opened(page, '/portfolio/web-apps');
    await page.mouse.move(640, 400);
    await page.mouse.wheel(0, 300);
    await page.waitForTimeout(2500);
    const second = page.locator('[data-post-title]').nth(1);
    await expect(second).toBeVisible();
    await expect(status(page)).toHaveText('');
    expect(
      await page.evaluate(() => document.activeElement === document.body),
    ).toBe(true);
  });
});

// The mean change per pixel and channel (0 to 255) between two screenshots.
const change = (page: Page, a: Buffer, b: Buffer) =>
  page.evaluate(
    async ([a, b]: [string, string]) => {
      const pixels = async (data: string) => {
        const image = new Image();
        image.src = `data:image/png;base64,${data}`;
        await image.decode();
        const canvas = document.createElement('canvas');
        canvas.width = image.width;
        canvas.height = image.height;
        const context = canvas.getContext('2d')!;
        context.drawImage(image, 0, 0);
        return context.getImageData(0, 0, image.width, image.height).data;
      };
      const p = await pixels(a);
      const q = await pixels(b);
      let sum = 0;
      for (let k = 0; k < p.length; k += 4)
        for (let c = 0; c < 3; c++) sum += Math.abs(p[k + c]! - q[k + c]!);
      return sum / (p.length / 4) / 3;
    },
    [a.toString('base64'), b.toString('base64')] as [string, string],
  );

test.describe('with reduced motion', () => {
  test.use({
    viewport: { width: 1280, height: 800 },
    reducedMotion: 'reduce',
  });

  test('the head and the sky hold still under a moving pointer', async ({
    page,
  }) => {
    await opened(page, '/');
    await page.waitForTimeout(1500);
    // The head and the sky beside it, left of the title.
    const clip = { x: 0, y: 80, width: 700, height: 640 };
    const shots = [];
    for (const [x, y] of [
      [100, 100],
      [1200, 700],
      [100, 700],
      [1200, 100],
    ] as const) {
      await page.mouse.move(x, y, { steps: 8 });
      await page.waitForTimeout(700);
      shots.push(await page.screenshot({ clip }));
    }
    // A blink may land between two of them; the rest show no motion at
    // all (the pointer moving them changes about 15 a pixel).
    const changes = [];
    for (let k = 1; k < shots.length; k++)
      changes.push(await change(page, shots[k - 1]!, shots[k]!));
    expect(Math.min(...changes)).toBeLessThan(1);
    expect(changes.filter((c) => c > 3).length).toBeLessThanOrEqual(1);
  });
});

// Changing page moves the sky to another resting place (skyViews.ts). With
// reduced motion it then holds still there; that it gets there in one frame
// is Sky.test.ts's (a runner drawing in software takes seconds over a frame,
// too few to tell a jump from a glide by eye). Read as the sky at the
// window's left edge, clear of the form, the header and the footer.
test('with reduced motion the sky moves to the next page and holds still', async ({
  page,
}) => {
  // Each screenshot waits for a frame: seconds apiece where drawn in software.
  test.setTimeout(180_000);
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await opened(page, '/');
  await page.waitForTimeout(1500);
  const clip = { x: 0, y: 120, width: 80, height: 560 };
  const before = await page.screenshot({ clip });
  await page.getByRole('link', { name: 'Contact', exact: true }).click();
  await page.waitForURL('**/contact');
  await page.waitForTimeout(5000);
  const settled = await page.screenshot({ clip });
  expect(await change(page, before, settled)).toBeGreaterThan(10);
  for (let k = 0; k < 3; k++) {
    await page.waitForTimeout(700);
    expect(
      await change(page, settled, await page.screenshot({ clip })),
    ).toBeLessThan(1);
  }
});

test.describe('in a forced-colours mode', () => {
  test.use({
    viewport: { width: 1280, height: 800 },
    forcedColors: 'active',
  });
  test.skip(
    ({ browserName }) => browserName !== 'chromium',
    'only Chrome emulates forced colours',
  );

  for (const path of ['/', '/contact'])
    test(`${path} shows its title once, as the 3D letters`, async ({
      page,
    }) => {
      await opened(page, path);
      await expect(page.locator('html[data-scene-drawn]')).toBeAttached();
      await expect(page.locator('h1')).toHaveCSS('color', 'rgba(0, 0, 0, 0)');
      await expect(page.locator('h1')).toHaveCSS(
        'background-color',
        'rgba(0, 0, 0, 0)',
      );
    });
});
