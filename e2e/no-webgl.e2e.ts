import { expect, test } from '@playwright/test';

// A browser with WebGL off (finding A14 of docs/audit/2026-11.md): the page
// opens without the 3D scene, its titles shown as text. Chrome only: its
// switches turn WebGL off. Against a built site: `npx playwright test`.

test.use({
  viewport: { width: 1280, height: 800 },
  launchOptions: { args: ['--disable-webgl', '--disable-3d-apis'] },
});

test.skip(
  ({ browserName }) => browserName !== 'chromium',
  'WebGL is turned off by Chrome switches',
);

for (const [path, title] of [
  ['/', "Zack Greenbauer's"],
  ['/contact', 'Contact Me'],
] as const)
  test(`${path} opens with its title as text`, async ({ page }) => {
    await page.goto(path);
    await expect(page.locator('html[data-page-in]')).toBeAttached({
      timeout: 15_000,
    });
    await expect(page.locator('canvas')).toHaveCount(0);
    const h1 = page.locator('h1');
    await expect(h1).toHaveText(title, { ignoreCase: true });
    await expect(h1).not.toHaveCSS('color', 'rgba(0, 0, 0, 0)');
    await expect(
      page.getByRole('link', { name: 'Contact', exact: true }),
    ).toBeVisible();
  });
