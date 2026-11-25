import { expect, Page, test } from '@playwright/test';

import { CHAPTERS } from '../components/Home/chapters';

// The home page's story (components/Home/Story.tsx): the name, then a
// chapter per page turn, each a post exactly as the portfolio shows its
// posts, while the head reacts and the scene brings each chapter's prop
// (named on the page as data-story-prop). Against a built site: `npx
// playwright test e2e/home-story.e2e.ts`.

// Every chapter in turn: on CI's runner, which draws the scene in software,
// about 18 seconds a chapter.
test.describe.configure({ timeout: 480_000 });

// The post of chapter k (the opening is post 0), and its card's title.
const post = (page: Page, k: number) => page.locator('[data-post]').nth(k + 1);
const title = (page: Page, k: number) => post(page, k).locator('section h2');

// The chapter whose card shows now (-1 for none).
const shownChapter = async (page: Page) => {
  for (let k = 0; k < CHAPTERS.length; k++)
    if (await title(page, k).isVisible()) return k;
  return -1;
};
// The chapter the page settles on: the same one three times running, three
// seconds apart (a turn under way, slow on CI's software renderer, and
// slower still in WebKit there, finishes first).
const settledChapter = async (page: Page) => {
  let last = await shownChapter(page);
  let same = 1;
  for (let k = 0; k < 12 && same < 3; k++) {
    await page.waitForTimeout(3000);
    const now = await shownChapter(page);
    same = now === last ? same + 1 : 1;
    last = now;
  }
  return last;
};

// One page turn by Page Down. A press the pager did not hear (on CI's slow
// runner, one sent before the page has hydrated, or while a card's arrival
// still holds turns) moves nothing, so it is sent again; one that was heard
// starts the glide at once, so it never turns twice.
async function turn(page: Page) {
  const top = () =>
    page.evaluate(() => document.getElementById('page')!.scrollTop);
  const from = await top();
  await expect(async () => {
    if ((await top()) === from) await page.keyboard.press('PageDown');
    await expect.poll(top, { timeout: 3000 }).not.toBe(from);
  }).toPass({ timeout: 30_000 });
}

// The page as it opens: the name, and the pager ready for a first turn
// (the first card's arrival holds turns for a moment, SnapPager.tsx).
async function open(page: Page, path = '/') {
  await page.goto(path);
  await expect(page.locator('h1')).toBeVisible();
  await page.waitForTimeout(1500);
}

test.describe('on a wide screen', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('tells every chapter in turn, each a post with its pictures and its prop', async ({
    page,
  }) => {
    await open(page);
    for (const [k, chapter] of CHAPTERS.entries()) {
      await turn(page);
      // A turn under way on CI's software renderer, in WebKit, can take
      // longer than the default wait to bring the card in.
      await expect(title(page, k)).toBeVisible({ timeout: 20_000 });
      await expect(title(page, k)).toHaveText(chapter.content.name);
      if (k === 0)
        await expect(post(page, 0).locator('section')).toContainText(
          'Hi, I’m Zack. Well, the head part.',
        );
      if (chapter.content.mediaSources?.length)
        await expect(
          post(page, k).locator('.collage-tile').first(),
        ).toBeAttached();
      // What the scene has drawn for it (StoryProps.tsx): its prop, once in.
      await expect(page.locator('html')).toHaveAttribute(
        'data-story-prop',
        chapter.prop ?? '',
        { timeout: 20_000 },
      );
      // The story is told on the card: no bubble, no story controls.
      await expect(page.locator('[data-bubble]')).toHaveCount(0);
      for (const name of ['Chapters', 'Play', 'Next'])
        await expect(
          page.getByRole('button', { name, exact: true }),
        ).toHaveCount(0);
      // The pager holds the next turn while this card arrives.
      await page.waitForTimeout(1500);
    }
    await expect(
      post(page, CHAPTERS.length - 1).getByRole('link', {
        name: 'Work with me',
      }),
    ).toHaveAttribute('href', '/work-with-me');
  });

  test('a chapter is the same post its portfolio page shows', async ({
    page,
  }) => {
    const k = CHAPTERS.findIndex((c) => c.id === 'banner-eyewear');
    await open(page);
    for (let n = 0; n <= k; n++) {
      await turn(page);
      await expect(title(page, n)).toBeVisible();
      await page.waitForTimeout(1500);
    }
    const card = await post(page, k).locator('section').innerText();
    const tiles = await post(page, k).locator('.collage-tile').count();

    // On Web Apps it is the second post: turned to, so its card shows.
    await open(page, '/portfolio/web-apps');
    await turn(page);
    const there = page.locator('[data-post]').nth(1);
    await expect(there.locator('section h2')).toHaveText('Banner Eyewear');
    await expect(there.locator('section h2')).toBeVisible();
    expect(await there.locator('section').innerText()).toBe(card);
    expect(await there.locator('.collage-tile').count()).toBe(tiles);
  });

  test('Watch plays the story and a wheel or a key stops it', async ({
    page,
  }) => {
    await open(page);
    const watch = page.getByRole('button', { name: 'Watch my story' });
    await watch.click();
    await expect(title(page, 0)).toBeVisible();
    // It moves on by itself after the first chapter.
    await expect(title(page, 1)).toBeVisible({ timeout: 30_000 });
    // A turn of the wheel (which may turn the page itself) stops it: it
    // stays on the chapter it lands on, past when Watch would have moved on
    // (chapters.ts seconds: under 13 a chapter).
    await page.mouse.move(640, 300);
    await page.mouse.wheel(0, 120);
    const stoppedOn = await settledChapter(page);
    await page.waitForTimeout(16_000);
    expect(await shownChapter(page)).toBe(stoppedOn);

    // Opened again, Watch again, then a key press from the page stops it
    // too.
    await open(page);
    await watch.click();
    await expect(title(page, 0)).toBeVisible();
    await page.evaluate(() => (document.activeElement as HTMLElement).blur());
    await page.keyboard.press('Shift');
    const keyedOn = await settledChapter(page);
    await page.waitForTimeout(16_000);
    expect(await shownChapter(page)).toBe(keyedOn);
  });

  test('a key sent to the window itself turns the page without an error', async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => {
      // WebKit reports a ResizeObserver that had more to say next frame as
      // an error; it is a notice, not a fault.
      if (!error.message.startsWith('ResizeObserver loop'))
        errors.push(error.message);
    });
    await open(page);
    // Sent again if the pager did not hear it yet (on CI's slow runner, one
    // sent before it listens moves nothing), as turn() does with a key press.
    const top = () =>
      page.evaluate(() => document.getElementById('page')!.scrollTop);
    await expect(async () => {
      if ((await top()) === 0)
        await page.evaluate(() =>
          dispatchEvent(new KeyboardEvent('keydown', { key: 'PageDown' })),
        );
      await expect.poll(top, { timeout: 3000 }).not.toBe(0);
    }).toPass({ timeout: 30_000 });
    await expect(title(page, 0)).toBeVisible({ timeout: 15_000 });
    expect(errors).toEqual([]);
  });
});

// The story's rewritten portfolio texts keep each card about as tall as it
// was, so the pictures above it keep their arrangement: shorter, the chair's
// left a taller space there and its two photos stacked instead of sitting
// side by side, as they do on the live site.
test.describe('on a tall laptop window', () => {
  test.use({ viewport: { width: 1400, height: 1259 } });

  test("the lounge chair's photos still sit side by side", async ({ page }) => {
    await open(page, '/portfolio/miscellaneous');
    await turn(page);
    const chair = page.locator('[data-post]').nth(1);
    await expect(chair.locator('section h2')).toHaveText(
      'Parametric Lounge Chair',
    );
    // A window this big is slow to draw in software (CI's WebKit), so the
    // card and its tiles get time to arrive and settle.
    await expect(chair.locator('section h2')).toBeVisible({ timeout: 30_000 });
    const tops = () =>
      chair
        .locator('.collage-tile')
        .evaluateAll((all) =>
          all.map((t) => Math.round(t.getBoundingClientRect().top)),
        );
    await expect
      .poll(
        async () => {
          const [a, b, ...more] = await tops();
          return more.length === 0 && b !== undefined && Math.abs(a! - b) < 4;
        },
        { timeout: 30_000 },
      )
      .toBe(true);
  });
});

test.describe('on a phone', () => {
  test.use({ viewport: { width: 375, height: 812 }, hasTouch: true });

  test('shows a chapter as the portfolio shows a post, pictures over its card', async ({
    page,
  }) => {
    // The second chapter: the first (Texas Tech) is told by the head alone.
    await open(page);
    await turn(page);
    // As on a wide screen: a turn in WebKit on CI's software renderer can
    // take longer than the default wait to bring the card in.
    await expect(title(page, 0)).toBeVisible({ timeout: 20_000 });
    await page.waitForTimeout(1500);
    await turn(page);
    await expect(title(page, 1)).toBeVisible({ timeout: 20_000 });
    // The tiles tuck 8px under the card's top, as a post's do (Post.tsx),
    // once the page's glide has ended: the card is already in its fixed
    // place while the tiles still scroll up with the page.
    const overlap = async () => {
      const tile = await post(page, 1)
        .locator('.collage-tile')
        .first()
        .boundingBox();
      const card = await post(page, 1).locator('section').boundingBox();
      return tile!.y + tile!.height - card!.y;
    };
    await expect.poll(overlap, { timeout: 10_000 }).toBeLessThanOrEqual(10);
  });

  test('keeps the name in its place, with Watch my story where the scroll arrow is', async ({
    page,
  }) => {
    await open(page);
    // The name centred 40px plus a tenth of the window down, as it was
    // before the story (TitleBox.tsx), not pushed up toward the menu.
    const name = await post(page, -1)
      .locator('[data-head-avoid]')
      .boundingBox();
    expect(
      Math.abs(name!.y + name!.height / 2 - (40 + 0.1 * 812)),
    ).toBeLessThan(3);
    // Watch sits in the footer, in the scroll arrow's place.
    const watch = page.getByRole('button', { name: 'Watch my story' });
    await expect(watch).toHaveCount(1);
    await expect(page.locator('footer').locator('[data-watch]')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Scroll down' })).toHaveCount(
      0,
    );
    // A tap on it plays the story: Texas Tech, then the arrow is back in its
    // place, and Watch is gone.
    await watch.tap();
    await expect(title(page, 0)).toBeVisible({ timeout: 20_000 });
    await expect(
      page.getByRole('button', { name: 'Scroll down' }),
    ).toBeVisible();
    await expect(watch).toHaveCount(0);
  });

  test('fetches no prop while the head is off the screen, and fetches them once it shows', async ({
    page,
  }) => {
    // The props' files (StoryProps.tsx, PhoneCall.tsx).
    const PROPS = /\/(glasses|cap|wire)\.[^/]*bin$|head-call\.|lens\/logo\./;
    const fetched: string[] = [];
    page.on('request', (r) => {
      if (PROPS.test(r.url())) fetched.push(r.url());
    });
    await open(page);
    // Through Banner Eyewear's chapter: the head steps off the screen for
    // each card, so none comes.
    for (let k = 0; k < 3; k++) {
      await turn(page);
      await expect(title(page, k)).toBeVisible({ timeout: 20_000 });
      await page.waitForTimeout(1500);
      // Nor does the scene name any prop as drawn.
      await expect(page.locator('html')).toHaveAttribute('data-story-prop', '');
    }
    await page.waitForTimeout(3000);
    expect(fetched).toEqual([]);
    // Widened, the head comes back beside the card, and they come.
    await page.setViewportSize({ width: 1280, height: 800 });
    await expect
      .poll(() => fetched.some((url) => /glasses\./.test(url)), {
        timeout: 30_000,
      })
      .toBe(true);
  });
});

test.describe('with reduced motion', () => {
  test.use({
    viewport: { width: 1280, height: 800 },
    reducedMotion: 'reduce',
  });

  test('never plays on its own', async ({ page }) => {
    await open(page);
    await expect(
      page.getByRole('button', { name: 'Watch my story' }),
    ).toHaveCount(0);
    await turn(page);
    await expect(title(page, 0)).toBeVisible();
    await page.waitForTimeout(15_000);
    await expect(title(page, 0)).toBeVisible();
    // Nor does the scene bring the chapter's prop (Texas Tech's cap and
    // tortillas).
    await expect(page.locator('html')).toHaveAttribute('data-story-prop', '');
  });
});
