import { expect as expectNow, test } from '@playwright/test';

// The 404 page's video (components/NotFound/NotFoundVideo.tsx): a tile of
// one, it comes in, rests still and bends as a post's images do, and melts
// in and out (components/MediaMelt.tsx), as its poster while the video is
// still loading. Against a built site: `npx playwright test`.

// A software-drawn runner can take many seconds over a frame.
const expect = expectNow.configure({ timeout: 30_000 });

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

  // Melting, it is drawn on the melt's canvas (canvas.fixed: MediaMelter.draw
  // sets a uniform4f for each picture it draws there), each draw noted with
  // how far the video itself has loaded; every frame the page draws is timed
  // too, and every time the canvas shows is counted. A browser drawing a
  // frame a fifth of a second apart or worse (a starved, software-drawn
  // runner, as CI's WebKit) can step a melt from start to end between two
  // frames, or see the site go on (PageLeave's 1.1 seconds) before it draws
  // one: there each melt is only seen to start, and the gap is noted. Held back, as on a slow connection or where a browser loads no
  // video until it plays, it melts as its poster: it used to wait unseen and
  // then just show.
  for (const isLoading of [false, true])
    test(`its video melts in and out as the site leaves${
      isLoading ? ', still loading' : ''
    }`, async ({ page }) => {
      await page.addInitScript(() => {
        const uniform = WebGLRenderingContext.prototype.uniform4f;
        const draws: number[] = [];
        const frames: number[] = [];
        const shows = { count: 0 };
        Object.assign(window, { draws, frames, shows });
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
          frames.push(now);
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
      await page.goto('/no-such-page');
      await expect(page.locator('.collage-tile')).toHaveCSS('opacity', '1');
      const melts = await page.evaluate(() =>
        document.documentElement.hasAttribute('data-melts'),
      );
      test.skip(!melts, 'no GPU here: it slides instead');
      // The page's middle frame gap so far, in milliseconds.
      const gap = await page.evaluate(() => {
        const { frames } = window as never as { frames: number[] };
        const gaps = frames.slice(1).map((at, k) => at - frames[k]!);
        return gaps.sort((a, b) => a - b)[gaps.length >> 1] ?? Infinity;
      });
      const isSmooth = gap < 200;
      expect(await page.evaluate('shows.count')).toBeGreaterThan(0);
      const drawsIn = (await page.evaluate('draws')) as number[];
      if (isSmooth) expect(drawsIn.length).toBeGreaterThan(0);
      expect(drawsIn.every((loaded) => !isLoading || loaded < 2)).toBe(true);
      await page.evaluate('draws.length = 0');
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
      if (isSmooth) expect(drawsOut).toBeGreaterThan(0);
      else
        test.info().annotations.push({
          type: 'note',
          description: `frames ${Math.round(gap)}ms apart: melt drawn ${drawsIn.length} times in, ${drawsOut} out`,
        });
    });
});
