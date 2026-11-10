import { expect as expectNow, Page, test } from '@playwright/test';

// What a page downloads, and when: the scene's files once each, started
// before the scripts have run (fetchEarly, components/Background/
// sceneFiles.ts); under the dark screen only the first post's pictures, each
// at its tile's size; a silent loop only once its post is shown
// (components/Media.tsx). Against a built site: `npx playwright test`.

// A software-drawn runner can take many seconds over a frame.
const expect = expectNow.configure({ timeout: 30_000 });

// Every request the page makes, with whether the page was in yet
// (data-page-in) when it was made.
function watch(page: Page) {
  const requests: { url: string; afterPageIn: boolean }[] = [];
  let isIn = false;
  page.on('request', (request) =>
    requests.push({ url: request.url(), afterPageIn: isIn }),
  );
  return {
    requests,
    pageIn: async () => {
      await page.waitForFunction(
        () => document.documentElement.hasAttribute('data-page-in'),
        null,
        { timeout: 60_000 },
      );
      isIn = true;
    },
  };
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
}

test.describe('the scene files', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  for (const route of ['/', '/contact', '/portfolio/miscellaneous']) {
    test(`are each downloaded once on ${route}`, async ({ page }) => {
      const seen = watch(page);
      await page.goto(route);
      await seen.pageIn();
      await page.waitForTimeout(2000);
      const scene = seen.requests
        .map(({ url }) => new URL(url).pathname)
        .filter((path) => path.startsWith('/background/'));
      expect(scene.sort()).toEqual([
        '/background/environment/cubicle-99.cube',
        '/background/environment/kiara_1_dawn_1k.hdr',
        '/background/fonts/kanit.json',
        '/background/geometry/head.bin',
      ]);
      // The page's own fetch is the browser's again once all are handed on.
      expect(await page.evaluate(() => window.fetch.toString())).toContain(
        'native code',
      );
    });
  }
});

test.describe("a post's pictures and loops", () => {
  test.use({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
  });

  test('under the dark screen, only the first post loads its pictures', async ({
    page,
  }) => {
    const seen = watch(page);
    await page.goto('/portfolio/miscellaneous');
    await seen.pageIn();
    const pictures = seen.requests.filter(({ url }) =>
      url.includes('/_next/image'),
    );
    const early = pictures.filter(({ afterPageIn }) => !afterPageIn);
    expect(early.length).toBeGreaterThan(0);
    for (const { url } of early) expect(url).toContain('bed-');
    // The rest follow once the page is in, before they are paged to.
    await expect
      .poll(() => seen.requests.filter(({ url }) => url.includes('shofar')))
      .not.toHaveLength(0);
  });

  test("each picture is fetched at its tile's size", async ({ page }) => {
    const seen = watch(page);
    await page.goto('/portfolio/miscellaneous');
    await seen.pageIn();
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
      expect(sizes).toBe(`${Math.round(shown)}px`);
      // At 2x: a copy at least twice the tile's width, never the widest.
      expect(fetched).toBeGreaterThanOrEqual(shown * 2);
      expect(fetched).toBeLessThan(1920);
    }
  });

  test('a silent loop loads only its poster until its post is shown', async ({
    page,
  }) => {
    const seen = watch(page);
    await page.goto('/portfolio/miscellaneous');
    await seen.pageIn();
    const loop = page.locator('video[src$="gears.mp4"]');
    await expect(loop).toHaveAttribute('preload', 'none');
    await expect(loop).toHaveAttribute('poster', '/miscellaneous/gears.jpg');
    expect(
      await loop.evaluate((video: HTMLVideoElement) => video.autoplay),
    ).toBe(false);
    await page.waitForTimeout(2000);
    const loads = () =>
      seen.requests.filter(({ url }) => url.endsWith('/gears.mp4'));
    expect(loads()).toHaveLength(0);
    expect(await loop.evaluate((video: HTMLVideoElement) => video.paused)).toBe(
      true,
    );

    await turnTo(page, 1);
    await turnTo(page, 2);
    await expect
      .poll(() => loop.evaluate((video: HTMLVideoElement) => !video.paused))
      .toBe(true);
    expect(loads().length).toBeGreaterThan(0);

    // It holds still once its post has gone.
    await turnTo(page, 3);
    await expect
      .poll(() => loop.evaluate((video: HTMLVideoElement) => video.paused))
      .toBe(true);
  });
});
