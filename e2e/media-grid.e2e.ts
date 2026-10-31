import { expect as expectNow, Page, test } from '@playwright/test';

// A post's images as the page shows them: one still block, rounded only at
// its outer corners, that no hover resizes, and that still comes in tile by
// tile, melting or, with no GPU, sliding. (Where the tiles go is
// collageLayout.test.ts; this is what the styles do with it.) Against a built
// site: `npx playwright test`.

// A software-drawn runner can take many seconds over a frame.
const expect = expectNow.configure({ timeout: 30_000 });

const SIZES = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'phone', width: 390, height: 844 },
];
const RADIUS = '16px';

// The first post's tiles once they have come in and the page has settled.
async function atRest(page: Page) {
  await page.goto('/portfolio/miscellaneous');
  await page.waitForFunction(() => {
    const tiles = [...document.querySelectorAll('.collage-tile')].slice(0, 4);
    return (
      tiles.length === 4 &&
      tiles.every(
        (tile) =>
          tile.closest('[data-shown]') &&
          tile.getAnimations().length === 0 &&
          getComputedStyle(tile).visibility === 'visible' &&
          getComputedStyle(tile).opacity === '1' &&
          getComputedStyle(tile).transform === 'none',
      )
    );
  });
}

// Each of the first post's tiles: where it is on the page, and each corner's
// radius and whether that corner is on the block's outline.
const tilesOf = (page: Page) =>
  page.evaluate(() => {
    const tiles = [
      ...document.querySelector('.collage')!.querySelectorAll('.collage-tile'),
    ];
    const boxes = tiles.map((tile) => tile.getBoundingClientRect());
    const left = Math.min(...boxes.map((box) => box.left));
    const right = Math.max(...boxes.map((box) => box.right));
    const top = Math.min(...boxes.map((box) => box.top));
    const bottom = Math.max(...boxes.map((box) => box.bottom));
    return tiles.map((tile, k) => {
      const box = boxes[k]!;
      const style = getComputedStyle(tile);
      return {
        box: [box.left, box.top, box.width, box.height],
        scale: style.scale,
        corners: [
          [style.borderTopLeftRadius, box.top === top && box.left === left],
          [style.borderTopRightRadius, box.top === top && box.right === right],
          [
            style.borderBottomRightRadius,
            box.bottom === bottom && box.right === right,
          ],
          [
            style.borderBottomLeftRadius,
            box.bottom === bottom && box.left === left,
          ],
        ] as [string, boolean][],
      };
    });
  });

for (const { name, width, height } of SIZES)
  test.describe(name, () => {
    test.use({ viewport: { width, height } });

    test('rounds only the outer corners', async ({ page }) => {
      await atRest(page);
      const corners = (await tilesOf(page)).flatMap((tile) => tile.corners);
      expect(corners.filter(([, isOuter]) => isOuter)).toHaveLength(4);
      for (const [radius, isOuter] of corners)
        expect(radius).toBe(isOuter ? RADIUS : '0px');
    });

    test('holds still at rest', async ({ page }) => {
      await atRest(page);
      const first = (await tilesOf(page)).map((tile) => tile.box);
      // Longer than a beat would need to show: any bounce moves them.
      for (let k = 0; k < 10; k++) {
        await page.waitForTimeout(200);
        expect((await tilesOf(page)).map((tile) => tile.box)).toEqual(first);
      }
    });
  });

test.describe('at rest', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  // The canvas lying over a resting tile hid the bend, froze a loop and covered
  // a video.
  test('nothing lies over the tiles', async ({ page }) => {
    await atRest(page);
    await expect(page.locator('canvas.fixed')).toBeHidden();
  });
});

test.describe('under a mouse', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('a tile keeps its size and the picture bends', async ({ page }) => {
    await atRest(page);
    const before = (await tilesOf(page)).map((tile) => tile.box);
    const [x, y, w, h] = before[0]!;
    await page.mouse.move(x! + w! / 4, y! + h! / 2);
    await page.mouse.move(x! + w! / 2, y! + h! / 2, { steps: 8 });
    // Laid over the picture once the trail reaches it; it hides again as the
    // trail fades, and a software-drawn runner can be seconds behind.
    await expect(page.locator('[data-media-bend]').first()).toBeAttached({
      timeout: 30_000,
    });
    await page.waitForTimeout(500);
    const after = await tilesOf(page);
    expect(after.map((tile) => tile.box)).toEqual(before);
    for (const { scale } of after) expect(scale).toBe('none');
  });
});

test.describe('every kind of media', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('a photo, a silent loop and a YouTube thumbnail all bend', async ({
    page,
  }) => {
    await atRest(page);
    for (let k = 0; k < 2; k++) {
      await page.evaluate(() =>
        dispatchEvent(new CustomEvent('page-glide', { detail: 1 })),
      );
      await page.waitForTimeout(2500);
    }
    const tiles = page.locator('.collage').nth(2).locator('.collage-tile');
    await expect(tiles).toHaveCount(3);
    await expect(tiles.nth(0).locator('button')).toBeVisible();
    await expect(tiles.nth(1).locator('video')).toBeVisible();
    for (let k = 0; k < 3; k++) {
      const box = (await tiles.nth(k).boundingBox())!;
      await page.mouse.move(box.x + 20, box.y + 20);
      await page.mouse.move(box.x + box.width / 2, box.y + 30, { steps: 6 });
      await expect(tiles.nth(k).locator('[data-media-bend]')).toBeAttached({
        timeout: 30_000,
      });
    }
  });
});

test.describe('More and Less', () => {
  test.use({ viewport: { width: 1280, height: 720 } });

  test('the images melt away and back', async ({ page }) => {
    // A crop worked out from a tile already gone comes out NaN, and draws one
    // flat colour.
    await page.addInitScript(() => {
      const uniform = WebGLRenderingContext.prototype.uniform4f;
      Object.assign(window, { badCrops: 0 });
      WebGLRenderingContext.prototype.uniform4f = function (at, ...values) {
        if (values.some(Number.isNaN))
          Object.assign(window, {
            badCrops: (window as never as { badCrops: number }).badCrops + 1,
          });
        return uniform.call(this, at, ...values);
      };
    });
    await page.goto('/portfolio/miscellaneous');
    const box = page.locator('.collage').first();
    await expect(box.locator('.collage-tile').first()).toBeVisible();
    const melts = await page.evaluate(() =>
      document.documentElement.hasAttribute('data-melts'),
    );
    test.skip(!melts, 'no GPU here: they fly instead');
    await page.getByRole('button', { name: 'More' }).first().click();
    await expect(page.locator('canvas.fixed')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Less' })).toBeVisible();
    await expect(box.locator('.collage-tile')).toHaveCount(0);
    await expect(page.locator('canvas.fixed')).toBeHidden();
    expect(await page.evaluate('badCrops')).toBe(0);
    await page.getByRole('button', { name: 'Less' }).click();
    await expect(box).toHaveAttribute('data-whole', '');
    await expect(box.locator('.collage-tile').first()).toHaveCSS(
      'opacity',
      '1',
    );
    await expect(page.locator('canvas.fixed')).toBeHidden();
  });
});

test.describe('the 404 page', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('its video comes in, holds still and bends', async ({ page }) => {
    await page.goto('/no-such-page');
    const tile = page.locator('.collage-tile');
    await expect(tile).toHaveCSS('opacity', '1');
    await expect(page.locator('canvas.fixed')).toBeHidden();
    // Its card may still be sliding in.
    await page.waitForTimeout(2000);
    // Linux WebKit rejects this 720p H.264 file, re-encoded too (format error,
    // no frames), so there is no picture to bend; Chrome and Mac WebKit play it.
    const canPlay = await tile.locator('video').evaluate(
      (video: HTMLVideoElement) =>
        new Promise<boolean>((resolve) => {
          const isSettled = () =>
            video.readyState >= 2 ||
            !!video.error ||
            video.networkState === video.NETWORK_NO_SOURCE;
          const wait = () =>
            isSettled()
              ? resolve(video.readyState >= 2)
              : setTimeout(wait, 100);
          wait();
        }),
    );
    test.skip(
      !canPlay && test.info().project.name === 'webkit',
      'this browser cannot decode the video',
    );
    const box = (await tile.boundingBox())!;
    await page.mouse.move(box.x + 20, box.y + 20);
    await page.mouse.move(box.x + box.width / 2, box.y + 40, { steps: 6 });
    await expect(tile.locator('[data-media-bend]')).toBeAttached();
    await page.mouse.move(2, 2);
    const first = await tile.boundingBox();
    await page.waitForTimeout(600);
    expect(await tile.boundingBox()).toEqual(first);
  });

  test('its video melts out as the site leaves', async ({ page }) => {
    await page.goto('/no-such-page');
    await expect(page.locator('.collage-tile')).toHaveCSS('opacity', '1');
    const melts = await page.evaluate(() =>
      document.documentElement.hasAttribute('data-melts'),
    );
    test.skip(!melts, 'no GPU here: it slides instead');
    await page
      .getByRole('link', { name: 'Contact', exact: true })
      .first()
      .click();
    await expect(page.locator('canvas.fixed')).toBeVisible();
    await expect(page).toHaveURL(/contact/);
  });
});

test.describe('tiles made anew', () => {
  test('come back after a window too short for images', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await atRest(page);
    await page.setViewportSize({ width: 844, height: 390 });
    await expect(page.locator('.collage').first()).toBeHidden();
    await page.setViewportSize({ width: 1280, height: 720 });
    await expect(
      page.locator('.collage').first().locator('.collage-tile').first(),
    ).toHaveCSS('opacity', '1');
  });

  for (const ms of [200, 700])
    test(`come back from Less ${ms}ms after More`, async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 720 });
      await atRest(page);
      await page.getByRole('button', { name: 'More' }).first().click();
      await page.waitForTimeout(ms);
      await page.getByRole('button', { name: 'Less' }).click();
      const tile = page.locator('.collage').first().locator('.collage-tile');
      await expect(tile).toHaveCount(4);
      for (let k = 0; k < 4; k++) {
        await expect(tile.nth(k)).toBeVisible();
        await expect(tile.nth(k)).toHaveCSS('opacity', '1');
      }
    });
});

test.describe('paging', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('the next post comes in from the right, each tile on its own wait', async ({
    page,
  }) => {
    await atRest(page);
    // They wait wholly off the window's right side, so that is where they come
    // from. (Read now: a slow browser may first look once they have landed.)
    const waiting = await page.evaluate(() =>
      [
        ...document
          .querySelectorAll('.collage')[1]!
          .querySelectorAll('.collage-tile'),
      ].map((tile) => new DOMMatrix(getComputedStyle(tile).transform).m41),
    );
    const melts = await page.evaluate(() =>
      document.documentElement.hasAttribute('data-melts'),
    );
    // As a scroll arrow turns, at once: a key is let go while the page's first
    // card is still arriving.
    await page.evaluate(() =>
      dispatchEvent(new CustomEvent('page-glide', { detail: 1 })),
    );
    if (melts) {
      // Drawn on the canvas while they melt: the tiles leaving hide, and the
      // tiles arriving show once they are whole.
      await page.waitForFunction(() => {
        const [leaving, next] = document.querySelectorAll('.collage');
        const tile = next!.querySelector('.collage-tile')!;
        return (
          !leaving!.hasAttribute('data-whole') &&
          next!.hasAttribute('data-shown') &&
          next!.hasAttribute('data-whole') &&
          getComputedStyle(tile).opacity === '1'
        );
      });
      return;
    }
    for (const x of waiting) expect(x).toBeGreaterThan(1000);
    const start = await page.waitForFunction(() => {
      const next = document.querySelectorAll('.collage')[1]!;
      if (!next.hasAttribute('data-shown')) return false;
      return [...next.querySelectorAll<HTMLElement>('.collage-tile')].map(
        (tile) => getComputedStyle(tile).transitionDelay,
      );
    });
    const delays = await start.jsonValue();
    if (!delays) throw new Error('the next post never showed');
    expect(delays.length).toBeGreaterThan(1);
    expect(new Set(delays).size).toBe(delays.length);
    await page.waitForFunction(() =>
      [
        ...document
          .querySelectorAll('.collage')[1]!
          .querySelectorAll('.collage-tile'),
      ].every((tile) => getComputedStyle(tile).transform === 'none'),
    );
  });
});
