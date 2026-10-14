import { defineConfig } from 'cypress';

export default defineConfig({
  video: true,
  videoCompression: 15,
  screenshotOnRunFailure: false,
  viewportWidth: 1920,
  viewportHeight: 1080,
  e2e: {
    baseUrl: 'http://localhost:4173',
    viewportWidth: 1920,
    viewportHeight: 1080,
    supportFile: false,
    defaultCommandTimeout: 10000,
  },
});
