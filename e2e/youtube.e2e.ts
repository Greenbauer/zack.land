import { expect as expectNow, Page, test } from '@playwright/test';

// A post's YouTube video (components/Media.tsx, components/PostCollage.tsx):
// played, it takes the post's width with its card faded away; a press
// outside it, a pause that lasts or paging away stops it; a press on its
// play button plays it again. YouTube's player is stood in for here
// (`STUB`, served as its iframe API), so each of its events comes when the
// test says. Against a built site: `npx playwright test`.

const expect = expectNow.configure({ timeout: 30_000 });

// YouTube's iframe API, reduced to what the site uses. The player notes each
// call (window.yt.calls), says it is playing or paused a moment after being
// asked, as the real one does (telling only a change), and readies once
// made, or, where `window.ytHeld` is set, only once `window.ytReady()` is
// called; `window.yt.seek()` pauses and plays again 100ms later, as a seek,
// and `window.yt.pause()` pauses, as from the player's own controls.
const STUB = `
window.YT = {
  PlayerState: { ENDED: 0, PLAYING: 1, PAUSED: 2 },
  Player: function (element, options) {
    const player = this;
    const iframe = document.createElement('iframe');
    element.appendChild(iframe);
    // Only a change of state is told, as YouTube does.
    let state = -1;
    const say = (data) => {
      if (data === state) return;
      state = data;
      options.events.onStateChange({ target: player, data });
    };
    player.calls = [];
    // The last it was asked for is what it goes to.
    let wanted = -1;
    const go = (data) => {
      wanted = data;
      setTimeout(() => say(wanted), 50);
    };
    player.playVideo = () => { player.calls.push('play'); go(1); };
    player.pauseVideo = () => { player.calls.push('pause'); go(2); };
    player.seek = () => { wanted = 2; say(2); setTimeout(() => { wanted = 1; say(1); }, 100); };
    player.pause = () => { wanted = 2; say(2); };
    player.getIframe = () => iframe;
    player.destroy = () => iframe.remove();
    window.yt = player;
    const ready = () => {
      options.events.onReady({ target: player });
      if (options.playerVars && options.playerVars.autoplay && wanted !== 2) {
        wanted = 1;
        say(1);
      }
    };
    if (window.ytHeld) window.ytReady = ready;
    else setTimeout(ready, 0);
  },
};
window.onYouTubeIframeAPIReady && window.onYouTubeIframeAPIReady();
`;

const glide = (page: Page, detail: 1 | -1) =>
  page.evaluate(
    (d) => dispatchEvent(new CustomEvent('page-glide', { detail: d })),
    detail,
  );

// Opens Miscellaneous on its third post, whose first tile is a YouTube video.
// `isHeld`: its player readies only when the test says (window.ytReady).
async function atVideoPost(page: Page, isHeld = false) {
  await page.route('**/www.youtube.com/iframe_api', (route) =>
    route.fulfill({ contentType: 'text/javascript', body: STUB }),
  );
  await page.addInitScript(
    (held) => Object.assign(window, { ytHeld: held }),
    isHeld,
  );
  await page.goto('/portfolio/miscellaneous');
  // A post at a time, each once its images have come in (a slow browser
  // can take longer over a turn than any fixed wait), and never sooner than
  // the pager takes another push the same way (HOLD_MS, paging.ts).
  const arrived = async (k: number) => {
    const post = page.locator('.collage').nth(k);
    await expect(post).toHaveAttribute('data-shown', '');
    await expect(post.locator('.collage-tile').first()).toHaveCSS(
      'opacity',
      '1',
    );
  };
  await arrived(0);
  for (const k of [1, 2]) {
    await glide(page, 1);
    await Promise.all([arrived(k), page.waitForTimeout(1500)]);
  }
  const box = page.locator('.collage').nth(2);
  const tile = box.locator('.collage-tile[data-video]');
  await expect(tile).toHaveCSS('opacity', '1');
  return { box, tile, play: tile.getByRole('button', { name: /^Play / }) };
}

const calls = (page: Page) =>
  page.evaluate(
    () => (window as never as { yt?: { calls: string[] } }).yt?.calls ?? [],
  );

test.describe('a YouTube video', () => {
  test.use({ viewport: { width: 1440, height: 900 } });
  // Each a page load, two turns and a play: a software-drawn WebKit takes
  // most of 90 seconds just to reach the post.
  test.beforeEach(({ browserName }) => {
    test.slow(browserName === 'webkit');
  });

  test('played, it takes the post with its corners rounded, and a press outside stops it', async ({
    page,
  }) => {
    const { box, tile, play } = await atVideoPost(page);
    const resting = await tile.boundingBox();
    await play.click();
    await expect(box).toHaveAttribute('data-playing');
    const post = (await page.locator('[data-post]').nth(2).boundingBox())!;
    await expect
      .poll(async () => Math.round((await tile.boundingBox())!.width))
      .toBe(Math.round(post.width));
    for (const corner of [
      'top-left',
      'top-right',
      'bottom-right',
      'bottom-left',
    ])
      await expect(tile).toHaveCSS(`border-${corner}-radius`, '16px');
    await expect(
      page.locator('[data-post]').nth(2).locator('section'),
    ).toHaveCSS('opacity', '0');
    await page.mouse.click(40, 450);
    await expect(box).not.toHaveAttribute('data-playing');
    expect(await calls(page)).toContain('pause');
    await expect.poll(() => tile.boundingBox()).toEqual(resting);
  });

  test('stopped by a press outside, it plays again from its button, and paging away still pauses it', async ({
    page,
  }) => {
    const { box, tile, play } = await atVideoPost(page);
    const resting = await tile.boundingBox();
    await play.click();
    await expect(box).toHaveAttribute('data-playing');
    await page.mouse.click(40, 450);
    await expect(box).not.toHaveAttribute('data-playing');
    // Pressed once it is back in its place: pressed while it still moves,
    // Playwright's click retries by scrolling it into view, which the page
    // takes as a turn.
    await expect.poll(() => tile.boundingBox()).toEqual(resting);
    await play.click();
    await expect(box).toHaveAttribute('data-playing');
    const before = (await calls(page)).length;
    await glide(page, -1);
    await expect
      .poll(async () => (await calls(page)).slice(before))
      .toContain('pause');
    await expect(box).not.toHaveAttribute('data-playing');
  });

  test('a pause as short as a seek does not stop it', async ({ page }) => {
    const { box, play } = await atVideoPost(page);
    await play.click();
    await expect(box).toHaveAttribute('data-playing');
    // Watched from inside the page, from before the seek: any moment it
    // stops counts.
    await box.evaluate((element) => {
      new MutationObserver(() => {
        if (!element.hasAttribute('data-playing'))
          Object.assign(window, { stopped: true });
      }).observe(element, { attributes: true });
    });
    await page.evaluate(() =>
      (window as never as { yt: { seek: () => void } }).yt.seek(),
    );
    // Longer than the seek's pause and the 300ms a pause is given.
    await page.waitForTimeout(1000);
    expect(await page.evaluate('window.stopped ?? false')).toBe(false);
    await expect(box).toHaveAttribute('data-playing');
  });

  test('a pause that lasts stops it', async ({ page }) => {
    const { box, play } = await atVideoPost(page);
    await play.click();
    await expect(box).toHaveAttribute('data-playing');
    await page.evaluate(() =>
      (window as never as { yt: { pause: () => void } }).yt.pause(),
    );
    await expect(box).not.toHaveAttribute('data-playing');
    await expect(play).toBeVisible();
  });

  test('readying after its post has left, it stays paused', async ({
    page,
  }) => {
    const { box, play } = await atVideoPost(page, true);
    await play.click();
    await glide(page, -1);
    // Gone before the player is ready.
    await expect(box).not.toHaveAttribute('data-shown');
    await page.waitForFunction(() => 'ytReady' in window);
    expect(await calls(page)).toEqual([]);
    await page.evaluate(() =>
      (window as never as { ytReady: () => void }).ytReady(),
    );
    await expect
      .poll(() => calls(page), { timeout: 10_000 })
      .toContain('pause');
    await page.waitForTimeout(500);
    expect(await calls(page)).not.toContain('play');
    await expect(box).not.toHaveAttribute('data-playing');
  });
});
