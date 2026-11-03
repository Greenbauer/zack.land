import { expect as expectNow, Locator, test } from '@playwright/test';

import { restingSharpness, sharpness } from './sharpness';

// The 404 page's video (components/NotFound/NotFoundVideo.tsx): a tile of
// one, it comes in, rests still and bends as a post's images do, and melts
// in and out (components/MediaMelt.tsx), as its poster while the video is
// still loading. Against a built site: `npx playwright test`.

// A software-drawn runner can take many seconds over a frame.
const expect = expectNow.configure({ timeout: 30_000 });

// Linux WebKit rejects this 720p H.264 file, re-encoded too (format error,
// no frames), so there it has no picture and never plays; Chrome and Mac
// WebKit play it.
const skipWhereUndecodable = async (tile: Locator) => {
  const canPlay = await tile.locator('video').evaluate(
    (video: HTMLVideoElement) =>
      new Promise<boolean>((resolve) => {
        const isSettled = () =>
          video.readyState >= 2 ||
          !!video.error ||
          video.networkState === video.NETWORK_NO_SOURCE;
        const wait = () =>
          isSettled() ? resolve(video.readyState >= 2) : setTimeout(wait, 100);
        wait();
      }),
  );
  test.skip(
    !canPlay && test.info().project.name === 'webkit',
    'this browser cannot decode the video',
  );
};

test.describe('the 404 page', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('its video comes in, holds still and bends', async ({ page }) => {
    await page.goto('/no-such-page');
    const tile = page.locator('.collage-tile');
    await expect(tile).toHaveCSS('opacity', '1');
    await expect(page.locator('canvas.fixed')).toBeHidden();
    // Its card may still be sliding in.
    await page.waitForTimeout(2000);
    await skipWhereUndecodable(tile);
    const box = (await tile.boundingBox())!;
    await page.mouse.move(box.x + 20, box.y + 20);
    await page.mouse.move(box.x + box.width / 2, box.y + 40, { steps: 6 });
    await expect(tile.locator('[data-media-bend]')).toBeAttached();
    await page.mouse.move(2, 2);
    const first = await tile.boundingBox();
    await page.waitForTimeout(600);
    expect(await tile.boundingBox()).toEqual(first);
  });

  // Zach, Nov 2: "whenever any video is being played ... everything behind
  // it should blur as we have for the other blur logic." Played, what lies
  // behind it blurs: its card's title, the header's links and the footer, read
  // for sharpness from the screen before and while it plays (sharpness.ts;
  // all three are blurred by a filter, which both browsers draw), and the
  // layer under the page that blurs the scene comes up. Paused, none of it.
  for (const { name, width, height } of [
    { name: 'desktop', width: 1440, height: 900 },
    { name: 'phone', width: 390, height: 844 },
  ])
    test(`played, everything behind it blurs, and paused, it stops (${name})`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height });
      await page.goto('/no-such-page');
      // Played, as only a video that plays can be.
      await skipWhereUndecodable(page.locator('.collage-tile'));
      const layer = page.locator('[data-behind-blur]');
      const chrome = page.locator('[data-site-chrome]');
      await expect(page.locator('.collage-tile')).toHaveCSS('opacity', '1');
      await expect(layer).toHaveCSS('visibility', 'hidden');
      const measure = () =>
        page.evaluate(() =>
          [
            document.querySelector('h3')!,
            [
              ...document.querySelectorAll(
                '[data-site-chrome] a, [data-site-chrome] button',
              ),
            ].find((e) => e.getBoundingClientRect().width > 0)!,
            document.querySelector('footer')!,
          ].map((element) => {
            const b = element.getBoundingClientRect();
            const x = Math.max(0, b.x);
            const y = Math.max(0, b.y);
            return {
              x,
              y,
              width: Math.min(b.right, innerWidth) - x,
              height: Math.min(b.bottom, innerHeight) - y,
            };
          }),
        );
      const { boxes: parts, sharp } = await restingSharpness(page, measure);
      await page.getByRole('button', { name: 'Play the video' }).click();
      await expect(layer).toHaveCSS('opacity', '1');
      await expect(layer).toHaveCSS('backdrop-filter', 'blur(6px)');
      for (const part of await chrome.all())
        await expect(part).toHaveCSS('filter', 'blur(6px)');
      await expect(page.locator('h3')).toHaveCSS('filter', 'blur(6px)');
      const blurred = await sharpness(page, parts);
      expect(blurred.map((b, k) => b < sharp[k]! * 0.67)).toEqual([
        true,
        true,
        true,
      ]);
      const tile = page.locator('.collage-tile');
      const t = (await tile.boundingBox())!;
      expect(
        await tile.evaluate(
          (element, [x, y]) =>
            element.contains(document.elementFromPoint(x!, y!)),
          [t.x + t.width / 2, t.y + t.height / 2],
        ),
      ).toBe(true);
      await page.getByRole('button', { name: 'Pause the video' }).click();
      await expect(layer).toHaveCSS('visibility', 'hidden');
      await expect(page.locator('h3')).toHaveCSS('filter', 'none');
      for (const part of await chrome.all())
        await expect(part).toHaveCSS('filter', 'none');
    });

  // Melting, it is drawn on the melt's canvas (canvas.fixed: MediaMelter.draw
  // sets a uniform4f for each picture it draws there), each draw noted with
  // how far the video itself has loaded; every time the canvas shows is
  // counted, and every frame the page draws while it shows. Held back, as on
  // a slow connection or where a browser loads no video until it plays, it
  // melts as its poster: it used to wait unseen and then just show. A
  // melt draws a picture only once its wait is over (up to 0.35 seconds
  // coming, 0.08 going) and until it ends, so a starved, software-drawn
  // runner (CI's WebKit can be one) may draw nothing of it: a frame, then
  // one 2 seconds on with the melt over, or the site gone on (PageLeave's 1.1
  // seconds). The draws are asserted where the melt was on screen for two
  // frames past its wait, a fifth of a second apart or less, and Chrome's
  // melt out on every run (below); elsewhere it is only seen to start, and
  // its frames are noted.
  for (const isLoading of [false, true])
    test(`its video melts in and out as the site leaves${
      isLoading ? ', still loading' : ''
    }`, async ({ page, browserName }) => {
      await page.addInitScript(() => {
        const uniform = WebGLRenderingContext.prototype.uniform4f;
        const draws: number[] = [];
        const meltFrames: number[] = [];
        const shows = { count: 0 };
        Object.assign(window, { draws, meltFrames, shows });
        new MutationObserver((changes) => {
          for (const { target } of changes)
            if (
              target instanceof HTMLElement &&
              target.matches('canvas.fixed') &&
              !target.hidden
            )
              shows.count++;
        }).observe(document, {
          subtree: true,
          attributes: true,
          attributeFilter: ['hidden'],
        });
        const tick = (now: number) => {
          const canvas = document.querySelector<HTMLElement>('canvas.fixed');
          if (canvas && !canvas.hidden) meltFrames.push(now);
          requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
        WebGLRenderingContext.prototype.uniform4f = function (at, ...values) {
          const canvas = this.canvas as HTMLCanvasElement;
          if (canvas.isConnected && canvas.matches('canvas.fixed')) {
            const video = document.querySelector('.collage-tile video');
            draws.push((video as HTMLVideoElement | null)?.readyState ?? -1);
          }
          return uniform.call(this, at, ...values);
        };
      });
      if (isLoading) await page.route('**/hello-is-it-me.mp4', () => {});
      // Not waiting for the page's load: a browser can hold that for the
      // video, which never comes here.
      await page.goto('/no-such-page', { waitUntil: 'domcontentloaded' });
      await expect(page.locator('.collage-tile')).toHaveCSS('opacity', '1');
      const melts = await page.evaluate(() =>
        document.documentElement.hasAttribute('data-melts'),
      );
      test.skip(!melts, 'no GPU here: it slides instead');
      // Whether the melt's frames since it began could show it, `waitMs`
      // being its longest wait.
      const isSeen = (waitMs: number) =>
        page.evaluate((waitMs) => {
          const { meltFrames: at } = window as never as {
            meltFrames: number[];
          };
          const gaps = at
            .slice(1)
            .map((t, k) => t - at[k]!)
            .sort((a, b) => a - b);
          const after = at.filter((t) => t - at[0]! > waitMs).length;
          return after >= 2 && (gaps[gaps.length >> 1] ?? Infinity) < 200;
        }, waitMs);
      const framesIn = (await page.evaluate('meltFrames.length')) as number;
      const isSeenIn = await isSeen(350);
      expect(await page.evaluate('shows.count')).toBeGreaterThan(0);
      const drawsIn = (await page.evaluate('draws')) as number[];
      if (isSeenIn) expect(drawsIn.length).toBeGreaterThan(0);
      expect(drawsIn.every((loaded) => !isLoading || loaded < 2)).toBe(true);
      await page.evaluate('draws.length = meltFrames.length = 0');
      // Watched, not polled: the melt is over within about a second, and
      // the click's own wait for the site to go took most of that on the
      // runner, so a poll first looked once it had gone.
      const melted = page.evaluate(
        () =>
          new Promise<boolean>((resolve) => {
            const canvas = document.querySelector<HTMLElement>('canvas.fixed')!;
            new MutationObserver(() => {
              if (!canvas.hidden) resolve(true);
            }).observe(canvas, { attributes: true });
          }),
      );
      await page
        .getByRole('link', { name: 'Contact', exact: true })
        .first()
        .click();
      expect(await melted).toBe(true);
      await expect(page).toHaveURL(/contact/);
      const drawsOut = ((await page.evaluate('draws')) as number[]).length;
      const framesOut = (await page.evaluate('meltFrames.length')) as number;
      // Chrome draws the melt out on its first frame after the click, within
      // milliseconds of it (on macOS and in Playwright's Linux image alike), so
      // there the melt out's draws are checked every run. WebKit drawn in
      // software can take longer than the melt lasts (under a second) to
      // step it, which then ends without a draw, so there it is checked
      // where its frames could show it.
      const isSeenOut = browserName === 'chromium' ? true : await isSeen(80);
      if (browserName === 'chromium') expect(framesOut).toBeGreaterThan(0);
      if (isSeenOut) expect(drawsOut).toBeGreaterThan(0);
      if (!isSeenIn || !isSeenOut)
        test.info().annotations.push({
          type: 'note',
          description: `melt frames ${framesIn} in, ${framesOut} out; uniform4f ${drawsIn.length} in, ${drawsOut} out (three per draw)`,
        });
    });
});
