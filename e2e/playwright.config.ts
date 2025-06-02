import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './dist',
  timeout: 120000,
  expect: {
    timeout: 30000,
  },
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: 'list',
  use: {
    headless: false,
    viewport: { width: 1280, height: 720 },
    actionTimeout: 60000,
    navigationTimeout: 60000,
    ignoreHTTPSErrors: true,
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'electron',
      testMatch: /.*\.spec\.js/,
    }
  ],
});
