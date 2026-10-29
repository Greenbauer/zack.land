import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    // With no GPU (as on CI) Chrome only draws WebGL in software when asked.
    setupNodeEvents(on) {
      on('before:browser:launch', (browser, launchOptions) => {
        if (browser.family === 'chromium')
          launchOptions.args.push('--enable-unsafe-swiftshader');
        return launchOptions;
      });
    },
  },
});
