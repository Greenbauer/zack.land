import { defineConfig, devices } from '@playwright/test';

// The portfolio's moving views (e2e/moving-views.e2e.ts), against a built and
// started site (BASE_URL, or localhost:3000), in Chrome and in WebKit,
// Safari's engine: the two differ in how the page settles on a post. Cypress
// (cypress/e2e) cannot emulate a phone, and its experimental WebKit would not
// load a local build served over http here (a redirect loop on its own runner
// page, then no connection), so these are Playwright's. Each test sets its own
// window and whether it is a phone.
export default defineConfig({
  testDir: 'e2e',
  testMatch: '*.e2e.ts',
  timeout: 90_000,
  workers: 2,
  reporter: 'list',
  use: { baseURL: process.env.BASE_URL ?? 'http://localhost:3000' },
  projects: [
    {
      name: 'chrome',
      use: {
        ...devices['Desktop Chrome'],
        // With no GPU (as on CI) Chrome only draws WebGL in software when
        // asked (as in cypress.config.ts).
        launchOptions: { args: ['--enable-unsafe-swiftshader'] },
      },
    },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
});
