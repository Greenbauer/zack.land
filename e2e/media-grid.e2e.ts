import { expect, Page, test } from '@playwright/test';

// A post's images as the page shows them: one still block, rounded only at
// its outer corners, that no hover resizes, and that still slides in tile by
// tile. (Where the tiles go is collageLayout.test.ts; this is what the styles
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

test.describe('under a mouse', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('a tile keeps its size and the picture bends', async ({ page }) => {
    await atRest(page);
    const before = (await tilesOf(page)).map((tile) => tile.box);
    const [x, y, w, h] = before[0]!;
    await page.mouse.move(x! + w! / 4, y! + h! / 2);
    await page.mouse.move(x! + w! / 2, y! + h! / 2, { steps: 8 });
    await expect(page.locator('[data-media-bend]').first()).toBeVisible();
    await page.waitForTimeout(500);
    const after = await tilesOf(page);
    expect(after.map((tile) => tile.box)).toEqual(before);
    for (const { scale } of after) expect(scale).toBe('none');
  });
});

test.describe('paging', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('the next post slides in from the right, each tile on its own wait', async ({
    page,
  }) => {
    await atRest(page);
    // As a scroll arrow turns, at once: a key is let go while the page's first
    // card is still arriving.
    await page.evaluate(() =>
      dispatchEvent(new CustomEvent('page-glide', { detail: 1 })),
    );
    const start = await page.waitForFunction(() => {
      const next = document.querySelectorAll('.collage')[1]!;
      if (!next.hasAttribute('data-shown')) return false;
      return [...next.querySelectorAll<HTMLElement>('.collage-tile')].map(
        (tile) => ({
          x: new DOMMatrix(getComputedStyle(tile).transform).m41,
          wait: getComputedStyle(tile).transitionDelay,
        }),
      );
    });
    const tiles = await start.jsonValue();
    if (!tiles) throw new Error('the next post never showed');
    expect(tiles.length).toBeGreaterThan(1);
    expect(new Set(tiles.map((tile) => tile.wait)).size).toBe(tiles.length);
    expect(Math.max(...tiles.map((tile) => tile.x))).toBeGreaterThan(1000);
    await page.waitForFunction(() =>
      [
        ...document
          .querySelectorAll('.collage')[1]!
          .querySelectorAll('.collage-tile'),
      ].every((tile) => getComputedStyle(tile).transform === 'none'),
    );
  });
});
