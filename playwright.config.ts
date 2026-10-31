import { defineConfig, devices } from '@playwright/test';

// The portfolio's moving views (e2e/moving-views.e2e.ts), the phone menu's
// hand-over to the next page (e2e/mobile-menu.e2e.ts) and what fades on a card
// as it slides (e2e/card-content.e2e.ts), against a built and started site (BASE_URL, or localhost:3000), in Chrome and in WebKit,
// Safari's engine: the two differ in how the page settles on a post. Cypress
// (cypress/e2e) cannot emulate a phone, and its experimental WebKit would not
// load a local build served over http here (a redirect loop on its own runner
// page, then no connection), so these are Playwright's. Each test sets its own
// window and whether it is a phone.
export default defineConfig({
  testDir: 'e2e',
  testMatch: '*.e2e.ts',
  timeout: 90_000,
  // Each test opens its own page, so tests of one file run side by side
  // too, and CI's shards (tests.yml) split by test, not by file: run file
  // by file, Chrome's moving views alone took 35 minutes on the runner.
  fullyParallel: true,
  workers: 2,
  reporter: 'list',
  use: {
    baseURL: process.env.BASE_URL ?? 'http://localhost:3000',
    // A failing test keeps its trace and video (test-results/), which CI
    // uploads, so a failure on the runner can be looked at, not guessed at.
    trace: 'retain-on-failure',
    video: 'retain-on-failure',
  },
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
