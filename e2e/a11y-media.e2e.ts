import { expect as expectNow, test } from '@playwright/test';

// A post's silent loop holds still with reduced motion (finding A10 of
// docs/audit/2026-11.md): it shows its poster and does not play. Against a
// built site: `npx playwright test`.

const expect = expectNow.configure({ timeout: 30_000 });

for (const [motion, plays] of [
  ['reduce', false],
  ['no-preference', true],
] as const)
  test.describe(`with motion "${motion}"`, () => {
    test.use({ viewport: { width: 1280, height: 720 }, reducedMotion: motion });

    test(`the loop on Web Apps' second post ${plays ? 'plays' : 'holds still'}`, async ({
      page,
    }) => {
      test.skip(
        plays && test.info().project.name === 'webkit',
        'Linux WebKit cannot decode this H.264 loop (see not-found.e2e.ts)',
      );
      await page.goto('/portfolio/web-apps');
      await page
        .locator('html[data-page-in]')
        .waitFor({ state: 'attached', timeout: 30_000 });
      await page.waitForTimeout(1500);
      await page.keyboard.press('ArrowDown');
      const post = page.locator('[data-post]').nth(1).locator('.collage');
      await expect(post).toHaveAttribute('data-shown', '');
      const loop = post.locator('video');
      if (plays) await expect(loop).toHaveJSProperty('paused', false);
      else {
        await page.waitForTimeout(2500);
        await expect(loop).toHaveJSProperty('paused', true);
        await expect(loop).toHaveJSProperty('currentTime', 0);
      }
    });
  });
