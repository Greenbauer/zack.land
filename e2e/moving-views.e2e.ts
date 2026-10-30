import { expect, Page, test } from '@playwright/test';

// Every way the portfolio's posts move, on a phone held upright and on its
// side and on two desktop sizes: a post of each kind (a video with photos, photos,
// text only), left open or closed, down to the next post or up to the one
// before, and back; and the window resized while a post is open. Back on the
// post, the page is on it (not part way into the post beside it), its card is
// closed, and no photo lies over the card's text; an open card on a phone ends
// at its bottom right with its links. Run in Chrome and WebKit
// (playwright.config.ts) with the browser's own snapping off (goTo), but for
// one case with reduced motion that keeps it on, against a built site:
// `npx playwright test`.

type Size = {
  name: string;
  width: number;
  height: number;
  isPhone: boolean;
};
const UPRIGHT: Size = {
  name: 'phone upright',
  width: 390,
  height: 844,
  isPhone: true,
};
const SIDEWAYS: Size = {
  name: 'phone on its side',
  width: 844,
  height: 390,
  isPhone: true,
};
const DESKTOP: Size = {
  name: 'desktop',
  width: 1280,
  height: 720,
  isPhone: false,
};
const SMALL_DESKTOP: Size = {
  name: 'small desktop',
  width: 1024,
  height: 640,
  isPhone: false,
};

// A post of each kind, and the ways it can be left: the text-only post is the
// first on its page, so there is no post before it to go up to.
const POSTS = [
  { kind: 'video', page: '/portfolio/miscellaneous', index: 2, ways: [1, -1] },
  { kind: 'photos', page: '/portfolio/web-apps', index: 1, ways: [1, -1] },
  { kind: 'text only', page: '/portfolio/web-apps', index: 0, ways: [1] },
] as const;

// What the page shows of a post: which post the page is on (its span of
// scroll positions, as the pager reads them, pageGlide.ts, holds the scroll
// position), how far the page is from the post's top or end, whether it is at
// the end of a post taller than the page, whether its card
// is open (Less) or laid open for a short window (with no More), whether
// anything on its card is cut short, how far its photos run past its card's
// top, and how far each of its links (Visit Site, View Code) is from the
// card's right edge.
type Look = {
  on: number;
  offPost: number;
  atEnd: boolean;
  button: string;
  isLaidOpen: boolean;
  isCut: boolean;
  photosOver: number;
  linksFromRight: number[];
};
const look = (page: Page, index: number) =>
  page.evaluate((index): Look => {
    const scroller = document.getElementById('page')!;
    const posts = [...document.querySelectorAll<HTMLElement>('[data-post]')];
    const pageTop = parseFloat(
      getComputedStyle(scroller).getPropertyValue('--page-top'),
    );
    const spanOf = (post: HTMLElement) => {
      const start =
        scroller.scrollTop + post.getBoundingClientRect().top - pageTop;
      const runsOn =
        post.offsetHeight - parseFloat(getComputedStyle(post).minHeight);
      return [start, start + Math.max(0, runsOn)] as const;
    };
    const top = scroller.scrollTop;
    const on = posts.findIndex((post) => {
      const [start, end] = spanOf(post);
      return top >= start - 1 && top <= end + 1;
    });
    const post = posts[index]!;
    const [start, end] = spanOf(post);
    const shown = (el: Element) =>
      el.getClientRects().length > 0 && getComputedStyle(el).display !== 'none';
    const button =
      [...post.querySelectorAll('button')]
        .find(
          (b) => shown(b) && /^(more|less)$/i.test(b.textContent?.trim() ?? ''),
        )
        ?.textContent?.trim() ?? 'none';
    const card = post.querySelector('section')!;
    const images = post.querySelector('.collage');
    const photosOver =
      images && shown(images) && card.style.position === 'fixed'
        ? images.getBoundingClientRect().bottom -
          card.getBoundingClientRect().top
        : 0;
    const article = post.querySelector('article')!;
    const right =
      article.getBoundingClientRect().right -
      parseFloat(getComputedStyle(article).paddingRight);
    const linksFromRight = [...post.querySelectorAll('article a')]
      .filter(
        (a) => shown(a) && /visit site|view code/i.test(a.textContent ?? ''),
      )
      .map((a) => Math.abs(a.getBoundingClientRect().right - right));
    return {
      on,
      offPost: Math.min(Math.abs(top - start), Math.abs(top - end)),
      atEnd: end > start && Math.abs(top - end) <= 1,
      button,
      isLaidOpen: post.hasAttribute('data-laid-open'),
      isCut: [article, ...article.querySelectorAll('*')].some(
        (el) => el.scrollHeight > el.clientHeight + 1,
      ),
      photosOver,
      linksFromRight,
    };
  }, index);

// Where the page comes to rest is what is checked, polled for a few seconds:
// a post's height can change between frames (a post left open closing once
// the page has moved on), and for a moment, before the pager puts it back
// (SnapPager.tsx), a read can find the page between posts. A page that stays
// off its post still fails.
const settled = <T>(
  page: Page,
  index: number,
  read: (_: Look) => T,
  message: string,
) =>
  expect.poll(async () => read(await look(page, index)), {
    message,
    timeout: 5_000,
  });

const goTo = async (page: Page, size: Size, path: string, index: number) => {
  await page.setViewportSize({ width: size.width, height: size.height });
  await page.goto(path);
  // The browser's own snapping off: Safari on an iPhone does not snap the
  // page back onto a post when the posts change height (and some WebKit
  // builds do while others do not), so with it off every browser here shows
  // what the site itself does, which must keep the page on its post.
  await page.addStyleTag({
    content: '#page { scroll-snap-type: none !important; }',
  });
  await page
    .locator('html[data-scene-ready]')
    .waitFor({ state: 'attached', timeout: 20_000 });
  // Paged down to the post as a visitor would, a page at a time.
  for (let k = 0; k < index; k++) await turnFrom(page, k, 1);
  await page.waitForTimeout(1500);
  expect((await look(page, index)).on).toBe(index);
};

// Pages down (1) or up (-1) until the page is on another post (through an
// open post first, a key at a time). After each press it waits for the page
// to rest on a post: where the 3D scene is drawn in software (a CI runner's
// WebKit) frames come slowly, and the 0.3s glide can take a second or more.
const turnFrom = async (page: Page, from: number, way: 1 | -1) => {
  for (let k = 0; k < 10; k++) {
    await page.keyboard.press(way > 0 ? 'PageDown' : 'PageUp');
    await page.waitForTimeout(1200);
    await expect
      .poll(async () => (await look(page, from)).on, {
        message: 'the page rests on a post',
        timeout: 10_000,
      })
      .not.toBe(-1);
    if ((await look(page, from)).on !== from) return;
  }
};

// Opens the card with More. A card laid open for a short window has none: it
// is open already. A card that shows whole, nothing on it cut short (on a
// phone, the text-only post's or one whose photos are held by the phone's
// width; on a desktop, one whose text fits), has nothing to open at this
// size, so the test is skipped there, said so in the report, rather than run
// again as the closed case. A card cut short with no More fails.
const openCard = async (page: Page, index: number) => {
  const now = await look(page, index);
  if (now.button !== 'More') {
    if (now.isLaidOpen) return;
    expect(now.isCut, 'a card cut short has More').toBe(false);
    test.skip(true, 'the card shows whole here: nothing to open');
  }
  await page
    .locator('[data-post]')
    .nth(index)
    .getByRole('button', { name: /^more$/i })
    .filter({ visible: true })
    .click();
  await page.waitForTimeout(1200);
  expect((await look(page, index)).button).toBe('Less');
};

// On a phone an open card ends at its bottom right with its links.
const expectLinksAtRight = async (page: Page, size: Size, index: number) => {
  if (size.width >= 768) return;
  for (const off of (await look(page, index)).linksFromRight)
    expect(off, "a link at the card's right").toBeLessThanOrEqual(2);
};

// Back on the post: the page is on it, at its top or (come back up to a post
// taller than the page) its end; its card is closed; and its photos keep
// above its card (they may tuck 8px under its top edge, Post.tsx's -mb-2).
const expectSettledOn = async (page: Page, index: number) => {
  await page.waitForTimeout(2500);
  await settled(
    page,
    index,
    (now) => now.offPost,
    'the page on the post',
  ).toBeLessThanOrEqual(1);
  const now = await look(page, index);
  expect(now.button, 'the card closed').not.toBe('Less');
  expect(now.photosOver, 'its photos above its card').toBeLessThanOrEqual(8);
};

for (const size of [UPRIGHT, SIDEWAYS, DESKTOP, SMALL_DESKTOP])
  test.describe(size.name, () => {
    test.use({ isMobile: size.isPhone, hasTouch: size.isPhone });
    for (const { kind, page: path, index, ways } of POSTS)
      for (const isOpen of [false, true])
        for (const way of ways)
          test(`${kind} post left ${isOpen ? 'open' : 'closed'}, ${
            way > 0 ? 'down to the next' : 'up to the one before'
          } and back`, async ({ page }) => {
            await goTo(page, size, path, index);
            if (isOpen) {
              await openCard(page, index);
              await expectLinksAtRight(page, size, index);
            }
            await turnFrom(page, index, way);
            await settled(page, index, (now) => now.on, 'left the post').toBe(
              index + way,
            );
            // A look at that post first, long enough for what changes there
            // to change (the footer's text coming in at the last post).
            await page.waitForTimeout(2500);
            await turnFrom(page, index + way, way > 0 ? -1 : 1);
            await expectSettledOn(page, index);
          });
  });

// Down at once as More opens the card, before its motion settles (the post
// is taller for a moment as the card rises): the page stays on the post or
// turns to the next, never stopping between them.
for (const size of [UPRIGHT, SIDEWAYS, DESKTOP, SMALL_DESKTOP])
  test.describe(`${size.name}, down as More opens`, () => {
    test.use({ isMobile: size.isPhone, hasTouch: size.isPhone });
    for (const { kind, page: path, index } of POSTS)
      test(`${kind} post`, async ({ page }) => {
        await goTo(page, size, path, index);
        const now = await look(page, index);
        test.skip(now.button !== 'More', 'no More to open at this size');
        await page
          .locator('[data-post]')
          .nth(index)
          .getByRole('button', { name: /^more$/i })
          .filter({ visible: true })
          .click();
        await page.keyboard.press('PageDown');
        await page.waitForTimeout(2500);
        await settled(
          page,
          index,
          (look) => look.on,
          'the page on a post',
        ).not.toBe(-1);
      });
  });

// With reduced motion, the keys jump instead of gliding, and the browser's
// own snapping is left on as a visitor has it: paging down from the top of
// Web Apps on a phone on its side, each press rests on a post, and the page
// comes to the end of each of the first two posts (laid open, taller than the
// page) before it turns to the next (snapping must not pull it back to a
// post's top).
test.describe('phone on its side, reduced motion, snapping on', () => {
  test.use({ isMobile: true, hasTouch: true });
  test('keys page through the first two laid open posts to their ends', async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.setViewportSize({
      width: SIDEWAYS.width,
      height: SIDEWAYS.height,
    });
    await page.goto('/portfolio/web-apps');
    await page
      .locator('html[data-scene-ready]')
      .waitFor({ state: 'attached', timeout: 20_000 });
    await page.waitForTimeout(1500);
    for (const index of [0, 1]) {
      expect((await look(page, index)).isLaidOpen, 'laid open').toBe(true);
      let reachedEnd = false;
      for (let k = 0; k < 10; k++) {
        await page.keyboard.press('PageDown');
        await page.waitForTimeout(800);
        const now = await look(page, index);
        expect(now.on, 'the page rests on a post').not.toBe(-1);
        if (now.on !== index) break;
        reachedEnd ||= now.atEnd;
      }
      expect(reachedEnd, `the page came to post ${index}'s end`).toBe(true);
      expect((await look(page, index)).on, 'turned to the next').toBe(
        index + 1,
      );
    }
  });
});

// On a phone on its side the space between the fades (160 to 192 pixels down
// a window 390 tall) lies wholly above the window's middle: paging down each
// page with the keys to its last post's end and back up to its top, with the
// browser's snapping on as a visitor has it, every stop shows the card of the
// post the page is on, and no other (at the end of a post laid open taller
// than the page, every card hid).
const shownCards = (page: Page) =>
  page.evaluate(() =>
    [...document.querySelectorAll('[data-post] > section')].flatMap(
      (card, k) => (getComputedStyle(card).visibility === 'visible' ? [k] : []),
    ),
  );
test.describe('phone on its side, a card at every stop', () => {
  test.use({ isMobile: true, hasTouch: true });
  for (const reducedMotion of ['reduce', 'no-preference'] as const)
    for (const path of ['/portfolio/web-apps', '/portfolio/miscellaneous'])
      test(`${path}, ${reducedMotion === 'reduce' ? 'reduced motion' : 'moving'}`, async ({
        page,
      }) => {
        await page.emulateMedia({ reducedMotion });
        await page.setViewportSize({
          width: SIDEWAYS.width,
          height: SIDEWAYS.height,
        });
        await page.goto(path);
        await page
          .locator('html[data-scene-ready]')
          .waitFor({ state: 'attached', timeout: 20_000 });
        await page.waitForTimeout(1500);
        const posts = await page.locator('[data-post]').count();
        let endsSeen = 0;
        for (const key of ['PageDown', 'PageUp']) {
          let last = -1;
          for (let k = 0; k < 20; k++) {
            await page.keyboard.press(key);
            await page.waitForTimeout(1200);
            const now = await look(page, 0);
            expect(now.on, 'the page rests on a post').not.toBe(-1);
            await expect
              .poll(() => shownCards(page), {
                message: `the card of post ${now.on} alone shows`,
                timeout: 5_000,
              })
              .toEqual([now.on]);
            if ((await look(page, now.on)).atEnd) endsSeen++;
            const top = await page.evaluate(
              () => document.getElementById('page')!.scrollTop,
            );
            if (Math.abs(top - last) < 1) break;
            last = top;
          }
          expect((await look(page, 0)).on, 'came to the far post').toBe(
            key === 'PageDown' ? posts - 1 : 0,
          );
        }
        expect(endsSeen, "stopped at a tall post's end").toBeGreaterThan(0);
      });
});

for (const [from, to] of [
  [UPRIGHT, SIDEWAYS],
  [SIDEWAYS, UPRIGHT],
  [DESKTOP, SMALL_DESKTOP],
  [SMALL_DESKTOP, DESKTOP],
] as const)
  test.describe(`${from.name} to ${to.name} and back`, () => {
    test.use({ isMobile: from.isPhone, hasTouch: from.isPhone });
    for (const { kind, page: path, index } of POSTS)
      test(`${kind} post resized while open`, async ({ page }) => {
        await goTo(page, from, path, index);
        await openCard(page, index);
        for (const size of [to, from]) {
          await page.setViewportSize({
            width: size.width,
            height: size.height,
          });
          await page.waitForTimeout(1500);
          await settled(page, index, (now) => now.on, 'still on the post').toBe(
            index,
          );
        }
        await expectLinksAtRight(page, from, index);
        // Closed with Less, if it is still open, it is as a closed card is.
        if ((await look(page, index)).button === 'Less')
          await page
            .locator('[data-post]')
            .nth(index)
            .getByRole('button', { name: /^less$/i })
            .filter({ visible: true })
            .click();
        await expectSettledOn(page, index);
      });
  });
