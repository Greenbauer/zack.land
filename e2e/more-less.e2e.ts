import { expect, Page, test } from '@playwright/test';

// On a phone, More then Less on any post puts it back exactly as it was:
// the same card, its images the same size and in the same place, and More
// back where it was. Then it holds still (components/usePhoneWhole.ts,
// components/useMoreMotion.ts). Against a built site: `npx playwright test
// e2e/more-less.e2e.ts`.

test.use({ viewport: { width: 390, height: 844 } });
// Every post of a page in one test, about 12 seconds each at rest: past the
// suite's 90 seconds on a CI runner that draws the scene in software.
test.describe.configure({ timeout: 300_000 });

// Chrome only, as the Cypress spec it replaces was. In WebKit (Playwright's,
// with or without phone emulation) More then Less leaves a post's tiles 12
// pixels left of where they were: a bug of its own, not fixed here.
test.skip(
  ({ browserName }) => browserName === 'webkit',
  'tiles shift in WebKit',
);

type Look = { card: number[]; tiles: number[][]; button: string | null };

// The post's card, its image tiles and its More or Less button, read in the
// page: each box rounded to whole pixels.
const look = (page: Page, k: number) =>
  page.evaluate((k): Look => {
    const post = document.querySelectorAll('[data-post]')[k]!;
    const box = (el: Element) => {
      const r = el.getBoundingClientRect();
      return [r.left, r.top, r.width, r.height].map(Math.round);
    };
    const button = [...post.querySelectorAll('button')].find(
      (b) =>
        getComputedStyle(b).display !== 'none' &&
        /^(more|less)$/i.test(b.textContent?.trim() ?? ''),
    );
    return {
      card: box(post.querySelector('section')!),
      tiles: [...post.querySelectorAll('.collage-tile')].map(box),
      button: button?.textContent ?? null,
    };
  }, k);

// Presses the post's More or Less, whichever shows.
const press = (page: Page, k: number, label: 'More' | 'Less') =>
  page
    .locator('[data-post]')
    .nth(k)
    .getByRole('button', { name: label, exact: true })
    .locator('visible=true')
    .click();

// Waits until the post is at rest: nothing in it animating, and its card,
// tiles and button the same over half a second.
const rest = async (page: Page, k: number) => {
  let last = '';
  await expect
    .poll(
      async () => {
        const moving = await page.evaluate(
          (k) =>
            document
              .querySelectorAll('[data-post]')
              [k]!.getAnimations({ subtree: true })
              .some(({ playState }) => playState === 'running'),
          k,
        );
        const now = JSON.stringify(await look(page, k));
        const still = !moving && now === last;
        last = now;
        return still;
      },
      { message: `post ${k} comes to rest`, intervals: [500], timeout: 15_000 },
    )
    .toBe(true);
};

for (const path of ['/portfolio/miscellaneous', '/portfolio/web-apps'])
  test(`More then Less puts every post on ${path} back as it was`, async ({
    page,
  }) => {
    await page.goto(path);
    // The page moves in after the intro (data-page-in, sceneReady.ts): in a
    // software-drawn WebKit that can be 10 seconds after the scene is up.
    await page
      .locator('html[data-page-in]')
      .waitFor({ state: 'attached', timeout: 30_000 });
    const posts = await page.locator('[data-post]').count();
    let checked = 0;
    for (let k = 0; k < posts; k++) {
      await page.evaluate((k) => {
        const post = document.querySelectorAll<HTMLElement>('[data-post]')[k]!;
        document.getElementById('page')!.scrollTop = post.offsetTop;
      }, k);
      await page.waitForTimeout(3000);
      await rest(page, k);
      const before = await look(page, k);
      if (before.button !== 'More') continue;
      checked++;
      await press(page, k, 'More');
      await page.waitForTimeout(1200);
      await press(page, k, 'Less');
      await page.waitForTimeout(2500);
      await rest(page, k);
      const after = await look(page, k);
      const name = `post ${k}`;
      expect(after.card, `${name} card`).toEqual(before.card);
      expect(after.button, `${name} button`).toBe('More');
      expect(after.tiles, `${name} tiles`).toEqual(before.tiles);
      // And it holds still: no flipping between short and whole.
      const changes = await page.evaluate(async (k) => {
        const post = document.querySelectorAll('[data-post]')[k]!;
        let changes = 0;
        const watch = new MutationObserver((m) => (changes += m.length));
        watch.observe(post, {
          subtree: true,
          attributes: true,
          childList: true,
        });
        await new Promise((done) => setTimeout(done, 2000));
        watch.disconnect();
        return changes;
      }, k);
      expect(changes, `${name} changes while still`).toBeLessThanOrEqual(2);
    }
    // A page whose posts all show whole would check nothing.
    expect(checked, 'posts with More').toBeGreaterThan(0);
  });
