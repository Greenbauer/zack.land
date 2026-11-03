import { expect as expectNow, Page, test } from '@playwright/test';

import { restingSharpness, sharpness } from './sharpness';

// Everything behind a post's playing video blurring (data-behind-blur and
// the header's and footer's filter, styles/globals.css), read off the page
// by e2e/youtube.e2e.ts.

const expect = expectNow.configure({ timeout: 30_000 });

// Zach, Nov 2: "whenever any video is being played, especially when it's in
// its expanded view (as in the buoyancy sorting video), everything behind it
// should blur as we have for the other blur logic." What lies behind the
// post's video and is on screen: the header's links and page title, the
// footer, and the scroll arrows over the sky (on a phone, the menu button
// for the links, and the footer's arrow with the footer). Each is read for sharpness from
// the screen before it plays and while it does (sharpness.ts). The title and
// the arrows over the sky lie under the page and are blurred by a backdrop
// (data-behind-blur), which Playwright's WebKit does not draw at all, so
// there only the parts blurred by a filter are read; in WebKit the layer's
// own state stands for the rest.
const behindVideo = (page: Page) =>
  page.evaluate(() => {
    const box = (element: Element, byBackdrop: boolean) => {
      const b = element.getBoundingClientRect();
      const x = Math.max(0, b.x);
      const y = Math.max(0, b.y);
      return {
        x,
        y,
        width: Math.min(b.right, innerWidth) - x,
        height: Math.min(b.bottom, innerHeight) - y,
        byBackdrop,
        name: element.textContent?.trim().slice(0, 24) || element.tagName,
      };
    };
    const [header, footer] = document.querySelectorAll('[data-site-chrome]');
    const shown = (element: Element) =>
      getComputedStyle(element).visibility !== 'hidden' &&
      element.getBoundingClientRect().width > 0;
    return [
      ...[...header!.querySelectorAll('a, button')].filter(shown).slice(0, 1),
      footer!.querySelector('footer')!,
    ]
      .map((element) => box(element, false))
      .concat(
        [
          ...header!.querySelectorAll('[data-scene-title]'),
          ...document.querySelectorAll('body > [data-scroll-arrows] button'),
        ]
          .filter(shown)
          .map((element) => box(element, true)),
      )
      .filter(({ width, height }) => width > 4 && height > 4);
  });

export async function expectBlurBehind(
  page: Page,
  play: () => Promise<void>,
  stop: () => Promise<void>,
  browserName: string,
) {
  // The page settles twice, before and after (restingSharpness), which a
  // software-drawn runner can take most of a minute over.
  test.slow();
  const layer = page.locator('[data-behind-blur]');
  const chrome = page.locator('[data-site-chrome]');
  await expect(layer).toHaveCSS('visibility', 'hidden');
  const measure = async () =>
    (await behindVideo(page)).filter(
      ({ byBackdrop }) => !byBackdrop || browserName === 'chromium',
    );
  const { boxes: parts, sharp } = await restingSharpness(page, measure);
  expect(parts.length).toBeGreaterThan(0);
  await play();
  await expect(layer).toHaveCSS('opacity', '1');
  await expect(layer).toHaveCSS('backdrop-filter', 'blur(6px)');
  for (const part of await chrome.all())
    await expect(part).toHaveCSS('filter', 'blur(6px)');
  const blurred = await sharpness(page, parts);
  await stop();
  await expectNoBlur(page);
  // Each part at most two thirds as sharp as it was at rest, before it played
  // or after it stopped, whichever is sharper: the text's colours follow the
  // sky behind each word (useSkyColours.ts), which drifts, so one of the two
  // may have caught a colour with less contrast.
  const { sharp: after } = await restingSharpness(page, measure);
  expect(
    parts.map(({ name }, k) => [
      name,
      blurred[k]! < Math.max(sharp[k]!, after[k]!) * 0.67,
    ]),
  ).toEqual(parts.map(({ name }) => [name, true]));
}

export const expectNoBlur = async (page: Page) => {
  await expect(page.locator('[data-behind-blur]')).toHaveCSS(
    'visibility',
    'hidden',
  );
  for (const part of await page.locator('[data-site-chrome]').all())
    await expect(part).toHaveCSS('filter', 'none');
};
