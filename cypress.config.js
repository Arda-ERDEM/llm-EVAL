import { defineConfig } from 'cypress';

export default defineConfig({
  video: true,
  videoCompression: false,
  videosFolder: 'cypress/videos',
  screenshotsFolder: 'cypress/screenshots',
  viewportWidth: 1920,
  viewportHeight: 1080,
  e2e: {
    baseUrl: 'http://127.0.0.1:8080',
    supportFile: false,
    specPattern: 'cypress/e2e/**/*.cy.{js,ts,mjs}',
    setupNodeEvents(on, config) {
      on('before:browser:launch', (browser = {}, launchOptions) => {
        if (browser.name === 'electron' && browser.isHeadless) {
          launchOptions.preferences.width = 1920;
          launchOptions.preferences.height = 1080;
        }
        return launchOptions;
      });
      return config;
    },
  },
});
