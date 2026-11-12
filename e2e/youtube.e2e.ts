import { expect as expectNow, Page, test } from '@playwright/test';

import { expectBlurBehind } from './blurBehind';

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

// What lies on top where `cover` overlaps the video's tile, read by hit
// testing (the order things are drawn in): for the card's glass layer below
// the post's images (data-photo-lens, EdgeCard.tsx), made hit-testable for
// the reading, and for each scroll arrow showing over the sky.
const glassOverVideo = (page: Page) =>
  page.evaluate(() => {
    const tile = document
      .querySelectorAll('.collage')[2]!
      .querySelector<HTMLElement>('.collage-tile[data-video]')!;
    const layer = document
      .querySelectorAll('[data-post]')[2]!
      .querySelector<HTMLElement>('[data-photo-lens]')!;
    const t = tile.getBoundingClientRect();
    const l = layer.getBoundingClientRect();
    const [x, y] = [Math.max(l.left, t.left), Math.max(l.top, t.top)];
    const [x2, y2] = [Math.min(l.right, t.right), Math.min(l.bottom, t.bottom)];
    if (x >= x2 || y >= y2 || !layer.style.getPropertyValue('--photo-lens'))
      return null;
    layer.style.pointerEvents = 'auto';
    const top = document.elementFromPoint((x + x2) / 2, (y + y2) / 2);
    layer.style.pointerEvents = '';
    return top === layer;
  });
const arrowsOverVideo = (page: Page) =>
  page.evaluate(() => {
    const tile = document
      .querySelectorAll('.collage')[2]!
      .querySelector<HTMLElement>('.collage-tile[data-video]')!;
    const t = tile.getBoundingClientRect();
    return [
      ...document.querySelectorAll<HTMLElement>('[data-scroll-arrows] button'),
    ].flatMap((arrow) => {
      const a = arrow.getBoundingClientRect();
      const [x, y] = [Math.max(a.left, t.left), Math.max(a.top, t.top)];
      const [x2, y2] = [
        Math.min(a.right, t.right),
        Math.min(a.bottom, t.bottom),
      ];
      if (x >= x2 || y >= y2 || getComputedStyle(arrow).visibility === 'hidden')
        return [];
      return [
        arrow.contains(document.elementFromPoint((x + x2) / 2, (y + y2) / 2)),
      ];
    });
  });

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

  // Zach, Nov 2: "seems like the glass effect is not effecting the video in
  // the default state". Its tile lay over the glass, as only a playing one
  // needs to.
  test('at rest, the glass of the card below lies over it, as over the other tiles', async ({
    page,
  }) => {
    await atVideoPost(page);
    // Once its card has slid in, which places the glass.
    await expect.poll(() => glassOverVideo(page)).toBe(true);
  });

  // Zach, Nov 2: "the glass blur on the scroll arrows covers the video. this
  // should be behind the expanded video view. kind of like opening a modal".
  test('playing, it lies over the scroll arrows and their glass, and over the other tiles until it has shrunk back', async ({
    page,
  }) => {
    const { box, tile, play } = await atVideoPost(page);
    await play.click();
    await expect(box).toHaveAttribute('data-playing');
    const post = (await page.locator('[data-post]').nth(2).boundingBox())!;
    await expect
      .poll(async () => Math.round((await tile.boundingBox())!.width))
      .toBe(Math.round(post.width));
    // At this window the up arrow lies where the video opens.
    const arrows = await arrowsOverVideo(page);
    expect(arrows.length).toBeGreaterThan(0);
    expect(arrows).toEqual(arrows.map(() => false));
    // Stopped, it stays over the others while it shrinks back (0.6s).
    await tile.evaluate((element) => {
      const z: string[] = [];
      Object.assign(window, { z });
      new MutationObserver(() => {
        if (element.hasAttribute('data-playing')) return;
        z.push(getComputedStyle(element).zIndex);
      }).observe(element, {
        attributes: true,
        attributeFilter: ['data-playing'],
      });
    });
    await page.mouse.click(40, 450);
    await expect(box).not.toHaveAttribute('data-playing');
    await expect.poll(() => page.evaluate('window.z')).toEqual(['20']);
    // And goes back among them once it has (a starved browser takes longer).
    await expect(tile).toHaveCSS('z-index', '0');
  });

  test('playing, everything behind it blurs, and stops blurring as it stops', async ({
    page,
    browserName,
  }) => {
    const { box, tile, play } = await atVideoPost(page);
    await expectBlurBehind(
      page,
      async () => {
        await play.click();
        await expect(box).toHaveAttribute('data-playing');
        // Opened, and its blur come in (0.3s).
        await page.waitForTimeout(1200);
        // The video itself stays on top, over all of it.
        const t = (await tile.boundingBox())!;
        expect(
          await tile.evaluate(
            (element, [x, y]) =>
              element.contains(document.elementFromPoint(x!, y!)),
            [t.x + t.width / 2, t.y + t.height / 2],
          ),
        ).toBe(true);
      },
      async () => {
        await page.mouse.click(40, 450);
        await expect(box).not.toHaveAttribute('data-playing');
      },
      browserName,
    );
  });

  // The header's dropdown, opened while the video plays, lies over the whole
  // window at once, sharp: the header's blur goes the moment it opens, with
  // no fade (a filter would make the header the box its fixed backdrop is laid
  // out in), though the press stops the video only once its pause lasts.
  test("playing, the header's dropdown opens over the whole window, sharp", async ({
    page,
  }) => {
    const { box, play } = await atVideoPost(page);
    await play.click();
    await expect(box).toHaveAttribute('data-playing');
    await page.waitForTimeout(1200);
    await page.locator('[data-nav-dropdown]').click();
    for (const part of await page.locator('[data-site-chrome]').all())
      await expect(part).toHaveCSS('filter', 'none', { timeout: 400 });
    const backdrop = page
      .locator('[data-nav-dropdown]')
      .locator('xpath=preceding-sibling::*[1]');
    expect(await backdrop.boundingBox()).toEqual({
      x: 0,
      y: 0,
      width: 1440,
      height: 900,
    });
  });

  // Finding A13 (docs/audit/2026-11.md): pressed from the keyboard, the play
  // button goes, so focus moves into the player rather than to the page, and
  // back to the button as it stops; the faded card's links are out of reach
  // meanwhile.
  test('played by keyboard, focus goes into the player and back as it stops', async ({
    page,
  }) => {
    const { box, play } = await atVideoPost(page);
    const card = page.locator('[data-post]').nth(2).locator('section');
    await play.focus();
    await page.keyboard.press('Enter');
    await expect(box).toHaveAttribute('data-playing');
    await expect(box.locator('iframe')).toBeFocused();
    await expect(card).toHaveJSProperty('inert', true);
    await page.evaluate(() =>
      (window as never as { yt: { pause: () => void } }).yt.pause(),
    );
    await expect(box).not.toHaveAttribute('data-playing');
    await expect(play).toBeFocused();
    await expect(card).toHaveJSProperty('inert', false);
    // Played again, the player is already there, hidden: focus still goes in.
    await page.keyboard.press('Enter');
    await expect(box).toHaveAttribute('data-playing');
    await expect(box.locator('iframe')).toBeFocused();
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

  // A window turned too short for the post's images drops its tiles, the
  // playing video's with them: its post is given back, the card shown and in
  // reach again, rather than left blank (audit B9).
  test('dropped while playing, as the window turns too short, it gives its post back', async ({
    page,
  }) => {
    const { box, play } = await atVideoPost(page);
    await play.click();
    await expect(box).toHaveAttribute('data-playing');
    const card = page.locator('[data-post]').nth(2).locator('section');
    await expect(card).toHaveCSS('opacity', '0');
    await page.setViewportSize({ width: 844, height: 390 });
    await expect(box).toBeHidden();
    await expect(box).not.toHaveAttribute('data-playing');
    await expect(card).toHaveCSS('opacity', '1');
    expect(
      await card.evaluate((section) => (section as HTMLElement).inert),
    ).toBe(false);
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

test.describe('a YouTube video on a phone', () => {
  test.use({ viewport: { width: 390, height: 844 } });
  test.beforeEach(({ browserName }) => {
    test.slow(browserName === 'webkit');
  });

  // Its scroll arrow is in the footer, below where the video opens, and the
  // card's glass does not reach its tile: checked wherever they do meet.
  test('playing, no scroll arrow lies over it', async ({ page }) => {
    const { box, play } = await atVideoPost(page);
    expect(await glassOverVideo(page)).not.toBe(false);
    await play.click();
    await expect(box).toHaveAttribute('data-playing');
    await page.waitForTimeout(1000);
    const arrows = await arrowsOverVideo(page);
    expect(arrows).toEqual(arrows.map(() => false));
  });

  test('playing, everything behind it blurs, and stops blurring as it stops', async ({
    page,
    browserName,
  }) => {
    const { box, play } = await atVideoPost(page);
    await expectBlurBehind(
      page,
      async () => {
        await play.click();
        await expect(box).toHaveAttribute('data-playing');
        await page.waitForTimeout(1200);
      },
      async () => {
        // Below the opened video, above the footer's scroll arrow.
        await page.mouse.click(195, 640);
        await expect(box).not.toHaveAttribute('data-playing');
      },
      browserName,
    );
  });
  // The menu, opened while the video plays, covers the whole window at once,
  // sharp, as the dropdown does above.
  test('playing, the menu opens over the whole window, sharp', async ({
    page,
  }) => {
    const { box, play } = await atVideoPost(page);
    await play.click();
    await expect(box).toHaveAttribute('data-playing');
    await page.waitForTimeout(1200);
    await page.getByRole('button', { name: 'Menu', exact: true }).click();
    for (const part of await page.locator('[data-site-chrome]').all())
      await expect(part).toHaveCSS('filter', 'none', { timeout: 400 });
    // Its height, which its slide in does not change.
    const menu = (await page.locator('.mobile-menu').boundingBox())!;
    expect(menu.height).toBeGreaterThanOrEqual(844);
  });
});
