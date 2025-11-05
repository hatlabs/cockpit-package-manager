import { defineConfig, devices } from '@playwright/test';
import * as dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// Validate required environment variables
if (!process.env.TEST_COCKPIT_URL) {
  throw new Error('TEST_COCKPIT_URL environment variable must be set. Copy .env.example to .env and configure.');
}

export default defineConfig({
  testDir: './test',
  testMatch: '**/*.spec.ts',
  timeout: 60000,
  fullyParallel: false,
  forbidOnly: false,
  retries: 0,
  workers: 1,
  maxFailures: 1,  // Stop after first failure
  reporter: 'list',
  use: {
    baseURL: process.env.TEST_COCKPIT_URL,
    ignoreHTTPSErrors: true,
    trace: 'on-first-retry',
    screenshot: 'on',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
