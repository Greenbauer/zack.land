import { expect, Page, test } from '@playwright/test';

// A post's images as the page shows them: one still block, rounded only at
// its outer corners, that no hover resizes, and that still comes in tile by
// tile, melting or, with no GPU, sliding. (Where the tiles go is collageLayout.test.ts; this is what the styles
// do with it.) Against a built site: `npx playwright test`.

const SIZES = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'phone', width: 390, height: 844 },
];
const RADIUS = '16px';

// The first post's tiles once they have slid in and the page has settled.
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

  // The canvas lying over a resting tile hid the bend, froze a GIF and covered
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
    await page.goto('/portfolio/miscellaneous');
    const box = page.locator('.collage').first();
    await expect(box.locator('.collage-tile').first()).toBeVisible();
    const melts = await page.evaluate(() =>
      document.documentElement.hasAttribute('data-melts'),
    );
    test.skip(!melts, 'no GPU here: they fly instead');
    await page.getByRole('button', { name: 'More' }).first().click();
    await expect(page.getByRole('button', { name: 'Less' })).toBeVisible();
    await expect(box.locator('.collage-tile')).toHaveCount(0);
    await page.getByRole('button', { name: 'Less' }).click();
    await expect(box).not.toHaveAttribute('data-whole', /.*/);
    await expect(box).toHaveAttribute('data-whole', '');
    await expect(box.locator('.collage-tile').first()).toBeVisible();
    await expect(page.locator('canvas.fixed')).toBeHidden();
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
          getComputedStyle(tile).visibility === 'visible'
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
