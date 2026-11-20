import { expect, Page, test } from '@playwright/test';

import { CHAPTERS } from '../components/Home/chapters';

// The home page's story (components/Home/Story.tsx): the name, then a
// chapter per page turn, the head's lines over it (data-bubble) and the
// chapter's card under it. Against a built site: `npx playwright test
// e2e/home-story.e2e.ts`.

// Every chapter in turn, about two seconds a turn: past the suite's 90
// seconds on a runner that draws the scene in software.
test.describe.configure({ timeout: 240_000 });

const bubble = (page: Page) => page.locator('[data-bubble]');
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
      await expect(bubble(page)).toHaveText(chapter.lines[0]!, {
        timeout: 8000,
      });
      // The head, and its line, sit left of the card, beside it.
      expect(await headAcross(page)).toBeLessThan(
        (await card(page, chapter.id).boundingBox())!.x,
      );
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
    const [first, second, third] = CHAPTERS;
    await expect(card(page, first!.id).locator('h2')).toBeVisible();
    // It moves on by itself after the first chapter's lines.
    await expect(card(page, second!.id).locator('h2')).toBeVisible({
      timeout: 15_000,
    });
    await page.mouse.move(640, 300);
    await page.mouse.wheel(0, 0.5);
    // Stopped: it stays on the chapter it was on, past when it would have
    // moved on.
    await page.waitForTimeout(12_000);
    await expect(card(page, third!.id).locator('h2')).toBeHidden();
    // Played again from the card, a key press stops it too.
    await card(page, second!.id).getByRole('button', { name: 'Play' }).click();
    await expect(card(page, third!.id).locator('h2')).toBeVisible({
      timeout: 15_000,
    });
    // From the page itself: a key on Play or Pause (data-watch) is the
    // story's own control, and does not stop it (watch.ts takesOver).
    await page.evaluate(() => (document.activeElement as HTMLElement).blur());
    await page.keyboard.press('Shift');
    // Past when it would have turned (its 11.1 seconds on this chapter,
    // watch.ts watchWait), with room for a slow runner.
    await page.waitForTimeout(15_000);
    await expect(card(page, CHAPTERS[3]!.id).locator('h2')).toBeHidden();
  });

  test('Chapters jumps straight to one', async ({ page }) => {
    await open(page);
    await page.keyboard.press('PageDown');
    const first = card(page, CHAPTERS[0]!.id);
    await expect(first.locator('h2')).toBeVisible();
    await first.getByRole('button', { name: 'Chapters' }).click();
    await page.getByRole('button', { name: 'USAA', exact: true }).click();
    await expect(card(page, 'usaa').locator('h2')).toBeVisible();
    await expect(bubble(page)).toContainText('USAA', { timeout: 8000 });
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
    await expect(bubble(page)).toHaveText(CHAPTERS[0]!.lines[0]!, {
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
