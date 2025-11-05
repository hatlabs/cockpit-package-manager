import { test, expect } from '@playwright/test';

test('Check search box alignment', async ({ page }) => {
  // Navigate to package manager
  await page.goto('https://halos.local:9090/packagemanager', {
    waitUntil: 'networkidle',
  });

  // Login
  await page.fill('input[name="login"]', 'claude');
  await page.fill('input[name="password"]', 'claude123');
  await page.click('button[type="submit"]');

  // Wait for Package Manager to load
  await page.waitForSelector('.group-list', { timeout: 10000 });

  // Click on a group to see the package list
  await page.click('.group-card');

  // Wait for package list to load
  await page.waitForSelector('.package-list', { timeout: 30000 });

  // Take a screenshot
  await page.screenshot({ path: 'test-results/alignment-check.png', fullPage: true });
});
