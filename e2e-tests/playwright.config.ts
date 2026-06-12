import { defineConfig, devices } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const API_URL = process.env.API_URL || 'http://localhost:4000';

export default defineConfig({
  testDir: './tests',
  fullyParallel: false, // sequential for predictable state
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: [['html'], ['list']],
  timeout: 60_000, // 60s per test

  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    actionTimeout: 10_000,
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  /* Start backend + frontend before tests if not already running */
  // webServer: [
  //   {
  //     command: 'cd ../backend && npm run dev',
  //     url: API_URL,
  //     reuseExistingServer: true,
  //   },
  //   {
  //     command: 'cd ../frontend && npm run dev',
  //     url: BASE_URL,
  //     reuseExistingServer: true,
  //   },
  // ],
});
