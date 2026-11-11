import { expect as expectNow, Page, test } from '@playwright/test';

// What a portfolio page downloads, and when: under the dark screen only the
// first post's pictures, each at its tile's size; a silent loop only once its
// post is shown (components/Media.tsx). Against a built site:
// `npx playwright test`.

// A software-drawn runner can take many seconds over a frame.
const expect = expectNow.configure({ timeout: 30_000 });

// The page's pictures and loops, each with when it was asked for and
// whether the page was in yet (data-page-in) then, both read in the page.
async function openWatched(page: Page, route: string) {
  await page.addInitScript(() => {
    new MutationObserver(() => {
      const html = document.documentElement;
      if (html?.hasAttribute('data-page-in'))
        (window as { pageInAt?: number }).pageInAt ??= performance.now();
    }).observe(document, {
      attributes: true,
      subtree: true,
      attributeFilter: ['data-page-in'],
    });
  });
  await page.goto(route);
  await page.waitForFunction(
    () => document.documentElement.hasAttribute('data-page-in'),
    null,
    { timeout: 60_000 },
  );
  return () =>
    page.evaluate(() => {
      const pageInAt = (window as { pageInAt?: number }).pageInAt!;
      return performance
        .getEntriesByType('resource')
        .map(({ name, startTime }) => ({
          url: name,
          afterPageIn: startTime >= pageInAt,
        }));
    });
}

// Waits until the first post's tiles have come in and the pager takes a
// turn (it lets the page's first card arriving count as one).
async function firstAtRest(page: Page) {
  await page.waitForFunction(() => {
    const tiles = [
      ...document.querySelector('.collage')!.querySelectorAll('.collage-tile'),
    ];
    return (
      tiles.length > 0 &&
      tiles.every(
        (tile) =>
          tile.closest('[data-shown]') && tile.getAnimations().length === 0,
      )
    );
  });
  await page.waitForTimeout(1500);
}

// Turns the page one post down and waits for post `k`'s tiles to come in.
async function turnTo(page: Page, k: number) {
  await page.evaluate(() =>
    dispatchEvent(new CustomEvent('page-glide', { detail: 1 })),
  );
  await expect(page.locator('.collage').nth(k)).toHaveAttribute(
    'data-shown',
    '',
  );
  await page.waitForTimeout(1500);
}

test.describe("a post's pictures and loops", () => {
  test.use({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
  });

  test('under the dark screen, only the first post loads its pictures', async ({
    page,
  }) => {
    const requests = await openWatched(page, '/portfolio/miscellaneous');
    // The rest follow once the page is in, before they are paged to.
    await expect
      .poll(async () =>
        (await requests()).filter(({ url }) => url.includes('shofar')),
      )
      .not.toHaveLength(0);
    const early = (await requests()).filter(
      ({ url, afterPageIn }) => url.includes('/_next/image') && !afterPageIn,
    );
    expect(early.length).toBeGreaterThan(0);
    for (const { url } of early) expect(url).toContain('bed-');
  });

  test("each picture is fetched at its tile's size", async ({ page }) => {
    await openWatched(page, '/portfolio/miscellaneous');
    await firstAtRest(page);
    const pictures = page.locator('.collage').first().locator('img');
    await expect(pictures).toHaveCount(4);
    for (const picture of await pictures.all()) {
      const { sizes, shown, fetched } = await picture.evaluate(
        (img: HTMLImageElement) => ({
          sizes: img.sizes,
          shown: img.closest('.collage-tile')!.getBoundingClientRect().width,
          fetched: Number(new URL(img.currentSrc).searchParams.get('w')),
        }),
      );
      // The widest the tile has been: its first layout can be a passing,
      // wider one (Media's useSizes).
      expect(parseFloat(sizes)).toBeGreaterThanOrEqual(Math.round(shown));
      // At 2x: a copy at least twice the tile's width, never the widest.
      expect(fetched).toBeGreaterThanOrEqual(shown * 2);
      expect(fetched).toBeLessThan(1920);
    }
  });

  test('a silent loop loads only its poster until its post is shown', async ({
    page,
  }) => {
    const requests = await openWatched(page, '/portfolio/miscellaneous');
    const loop = page.locator('video[src$="gears.mp4"]');
    await expect(loop).toHaveAttribute('preload', 'none');
    await expect(loop).toHaveAttribute('poster', '/miscellaneous/gears.jpg');
    expect(
      await loop.evaluate((video: HTMLVideoElement) => video.autoplay),
    ).toBe(false);
    await firstAtRest(page);
    const loads = async () =>
      (await requests()).filter(({ url }) => url.endsWith('/gears.mp4'));
    expect(await loads()).toHaveLength(0);
    expect(await loop.evaluate((video: HTMLVideoElement) => video.paused)).toBe(
      true,
    );

    await turnTo(page, 1);
    await turnTo(page, 2);
    await expect
      .poll(() => loop.evaluate((video: HTMLVideoElement) => !video.paused))
      .toBe(true);
    expect((await loads()).length).toBeGreaterThan(0);

    // It holds still once its post has gone.
    await turnTo(page, 3);
    await expect
      .poll(() => loop.evaluate((video: HTMLVideoElement) => video.paused))
      .toBe(true);
  });
});
