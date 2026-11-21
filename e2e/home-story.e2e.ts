import { expect, Page, test } from '@playwright/test';

import { CHAPTERS } from '../components/Home/chapters';

// The home page's story (components/Home/Story.tsx): the name, then a
// chapter per page turn, the head's lines over it (data-bubble) and the
// chapter's card under it. Against a built site: `npx playwright test
// e2e/home-story.e2e.ts`.

// Every chapter in turn: on CI's runner, which draws the scene in software,
// about 18 seconds a chapter (the walk reached 13 of 16 in four minutes).
test.describe.configure({ timeout: 480_000 });

const bubble = (page: Page) => page.locator('[data-bubble]');
// Any one of a chapter's lines, as the bubble shows them one at a time
// (which first is chapters.test.ts's): on CI's slow software renderer the
// first can have gone by the time its card has arrived.
const saying = (id: string) =>
  new RegExp(
    `^(${CHAPTERS.find((chapter) => chapter.id === id)!
      .lines.map((line) => line.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
      .join('|')})$`,
  );
// The chapter whose card shows now.
const shownChapter = async (page: Page) => {
  for (const { id } of CHAPTERS)
    if (await card(page, id).locator('h2').isVisible()) return id;
  return '';
};
// The chapter the page settles on: the same one twice, three seconds apart
// (a turn under way, slow on CI's software renderer, finishes first).
const settledChapter = async (page: Page) => {
  let last = await shownChapter(page);
  for (let k = 0; k < 8; k++) {
    await page.waitForTimeout(3000);
    const now = await shownChapter(page);
    if (now === last) return now;
    last = now;
  }
  return last;
};
// Where across the head is (px), as the bubble follows it (Bubble.tsx).
const headAcross = (page: Page) =>
  bubble(page).evaluate((el) =>
    parseFloat((el as HTMLElement).style.getPropertyValue('--bubble-x')),
  );
const card = (page: Page, id: string) =>
  page.locator(`[data-chapter="${id}"] section`);

// The page as it opens: the name, and the pager ready for a first turn
// (the first card's arrival holds turns for a moment, SnapPager.tsx).
async function open(page: Page) {
  await page.goto('/');
  await expect(page.locator('h1')).toBeVisible();
  await page.waitForTimeout(1500);
}

test.describe('on a wide screen', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('tells every chapter in turn, a line at a time over the head', async ({
    page,
  }) => {
    await open(page);
    await expect(bubble(page)).toHaveText('');
    for (const chapter of CHAPTERS) {
      await page.keyboard.press('PageDown');
      await expect(card(page, chapter.id).locator('h2')).toBeVisible();
      await expect(card(page, chapter.id).locator('h2')).toHaveText(
        chapter.title,
      );
      await expect(bubble(page)).toHaveText(saying(chapter.id), {
        timeout: 8000,
      });
      // The head, and its line, end up left of where the card rests (a
      // fixed box's offset leaves out the slide it may still be part way
      // through; the head glides there, and in WebKit on CI the scene may
      // not have placed it yet).
      const rests = await card(page, chapter.id).evaluate(
        (el) => (el as HTMLElement).offsetLeft,
      );
      await expect
        .poll(() => headAcross(page), { timeout: 20_000 })
        .toBeLessThan(rests);
      // The pager holds the next turn while this card arrives.
      await page.waitForTimeout(1500);
    }
    await expect(
      card(page, 'next').getByRole('link', { name: 'Work with me' }),
    ).toHaveAttribute('href', '/work-with-me');
  });

  test('Watch plays the story and a wheel or a key stops it', async ({
    page,
  }) => {
    await open(page);
    await page.getByRole('button', { name: 'Watch my story' }).click();
    const [first, second] = CHAPTERS;
    await expect(card(page, first!.id).locator('h2')).toBeVisible();
    // It moves on by itself after the first chapter's lines.
    await expect(card(page, second!.id).locator('h2')).toBeVisible({
      timeout: 15_000,
    });
    // A turn of the wheel (which may turn the page itself) stops it: it
    // stays on the chapter it lands on, past when Watch would have moved
    // on (watch.ts watchWait: under 12 seconds a chapter).
    await page.mouse.move(640, 300);
    await page.mouse.wheel(0, 120);
    const stoppedOn = await settledChapter(page);
    await expect(
      card(page, stoppedOn).getByRole('button', { name: 'Play' }),
    ).toBeVisible();
    await page.waitForTimeout(15_000);
    expect(await shownChapter(page)).toBe(stoppedOn);
    // Played again from the card, it moves on; a key press from the page
    // stops it too. (A key on Play or Pause, data-watch, is the story's own
    // control and does not stop it: watch.ts takesOver.)
    await card(page, stoppedOn).getByRole('button', { name: 'Play' }).click();
    await expect
      .poll(() => shownChapter(page), { timeout: 30_000 })
      .not.toBe(stoppedOn);
    await page.evaluate(() => (document.activeElement as HTMLElement).blur());
    await page.keyboard.press('Shift');
    const keyedOn = await settledChapter(page);
    await expect(
      card(page, keyedOn).getByRole('button', { name: 'Play' }),
    ).toBeVisible();
    await page.waitForTimeout(15_000);
    expect(await shownChapter(page)).toBe(keyedOn);
  });

  test('a key sent to the window itself turns the page without an error', async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await open(page);
    await page.evaluate(() =>
      dispatchEvent(new KeyboardEvent('keydown', { key: 'PageDown' })),
    );
    await expect(card(page, CHAPTERS[0]!.id).locator('h2')).toBeVisible();
    expect(errors).toEqual([]);
  });

  test('Chapters jumps straight to one', async ({ page }) => {
    await open(page);
    await page.keyboard.press('PageDown');
    const first = card(page, CHAPTERS[0]!.id);
    await expect(first.locator('h2')).toBeVisible();
    await first.getByRole('button', { name: 'Chapters' }).click();
    await page.getByRole('button', { name: 'USAA', exact: true }).click();
    await expect(card(page, 'usaa').locator('h2')).toBeVisible();
    await expect(bubble(page)).toHaveText(saying('usaa'), { timeout: 8000 });
  });
});

test.describe('on a phone', () => {
  test.use({ viewport: { width: 375, height: 812 }, hasTouch: true });

  test('keeps the head in view, its line over it and the card over its chest', async ({
    page,
  }) => {
    await open(page);
    await page.keyboard.press('PageDown');
    const first = card(page, CHAPTERS[0]!.id);
    await expect(first.locator('h2')).toBeVisible();
    // The head stays put under the card (data-head-avoid="above"), rather
    // than moving off the window as it does for a portfolio post's card.
    await expect(first).toHaveAttribute('data-head-avoid', 'above');
    await expect(bubble(page)).toHaveText(saying(CHAPTERS[0]!.id), {
      timeout: 8000,
    });
    const line = await bubble(page).boundingBox();
    const box = await first.boundingBox();
    expect(line!.y + line!.height).toBeLessThan(box!.y);
    // The head's middle, as the page places it (HeadFraming, followed by the
    // bubble as --bubble-x): on screen, near the middle, not glided off.
    const headX = await headAcross(page);
    expect(headX).toBeGreaterThan(375 * 0.3);
    expect(headX).toBeLessThan(375 * 0.7);
    // The card sits below the face: the head's chin is about 0.72 of the
    // window's height down (PageScroller/ScrollArrows.tsx HEAD_CHIN).
    expect(box!.y).toBeGreaterThan(812 * 0.7);
  });
});

test.describe('with reduced motion', () => {
  test.use({
    viewport: { width: 1280, height: 800 },
    reducedMotion: 'reduce',
  });

  test('shows every line at once and never plays on its own', async ({
    page,
  }) => {
    await open(page);
    await expect(
      page.getByRole('button', { name: 'Watch my story' }),
    ).toHaveCount(0);
    await page.keyboard.press('PageDown');
    const [first] = CHAPTERS;
    await expect(card(page, first!.id).locator('h2')).toBeVisible();
    for (const line of first!.lines)
      await expect(bubble(page)).toContainText(line);
    await expect(
      card(page, first!.id).getByRole('button', { name: 'Play' }),
    ).toHaveCount(0);
    // A chapter of three lines shows all three.
    const banner = CHAPTERS.find((chapter) => chapter.id === 'banner-eyewear')!;
    for (let k = 0; k < 2; k++) {
      await page.waitForTimeout(1500);
      await page.keyboard.press('PageDown');
    }
    await expect(card(page, banner.id).locator('h2')).toBeVisible();
    for (const line of banner.lines)
      await expect(bubble(page)).toContainText(line);
  });
});
