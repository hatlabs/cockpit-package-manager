import { test, expect } from '@playwright/test';

// Test credentials from environment variables (required)
const TEST_USERNAME = process.env.TEST_USERNAME;
const TEST_PASSWORD = process.env.TEST_PASSWORD;

if (!TEST_USERNAME || !TEST_PASSWORD) {
  throw new Error('TEST_USERNAME and TEST_PASSWORD environment variables must be set. Copy .env.example to .env and configure.');
}

test.describe('Cockpit Package Manager', () => {
  test.beforeEach(async ({ page, context }) => {
    // Ignore SSL certificate errors for local testing
    await context.setExtraHTTPHeaders({
      'Accept-Language': 'en-US,en;q=0.9',
    });
  });

  test('should load package manager page', async ({ page }) => {
    // Enable console logging
    page.on('console', msg => {
      console.log(`Browser console [${msg.type()}]:`, msg.text());
    });

    // Capture page errors
    page.on('pageerror', error => {
      console.error('Page error:', error);
    });

    // Capture failed requests
    page.on('requestfailed', request => {
      console.error(`Request failed: ${request.url()} - ${request.failure()?.errorText}`);
    });

    console.log('Navigating to Cockpit...');

    // Navigate to Cockpit login page
    await page.goto('https://halos.local:9090', {
      waitUntil: 'domcontentloaded',
      timeout: 30000
    });

    console.log('Page loaded, checking for login form...');

    // Wait for page to be ready
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);

    // Check if we need to login - look for the username input
    const usernameInput = page.getByLabel('User name');
    try {
      await usernameInput.waitFor({ state: 'visible', timeout: 3000 });
      console.log('Login form found, logging in...');

      // Fill in login credentials
      await usernameInput.click();
      await usernameInput.fill(TEST_USERNAME);
      console.log('Username filled');

      const passwordInput = page.locator('#login-password-input');
      await passwordInput.click();
      await passwordInput.fill(TEST_PASSWORD);
      console.log('Password filled');

      // Click the login button
      const loginButton = page.locator('button:has-text("Log in")');
      await loginButton.click();
      console.log('Login button clicked');

      // Wait for navigation after login
      await page.waitForLoadState('networkidle', { timeout: 15000 });
      console.log('Login successful');
    } catch (e) {
      console.log('Login error:', e);
    }

    // Wait for Cockpit to load
    await page.waitForSelector('iframe#cockpit1\\:localhost\\/packagemanager, a[href*="packagemanager"]', {
      timeout: 10000
    });

    console.log('Looking for Package Manager link...');

    // Try to find and click the Package Manager link in the sidebar
    const packageManagerLink = page.locator('a[href*="packagemanager"]').first();
    if (await packageManagerLink.isVisible({ timeout: 2000 }).catch(() => false)) {
      console.log('Found Package Manager link, clicking...');
      await packageManagerLink.click();
      await page.waitForTimeout(2000);
    } else {
      console.log('Package Manager link not found in sidebar, trying direct URL...');
      await page.goto('https://halos.local:9090/packagemanager', {
        waitUntil: 'domcontentloaded',
        timeout: 10000
      });
    }

    // Wait for the iframe to load
    console.log('Waiting for iframe...');
    const iframe = page.frameLocator('iframe#cockpit1\\:localhost\\/packagemanager');

    // Wait a bit for the app to initialize
    await page.waitForTimeout(2000);

    // Take a screenshot
    await page.screenshot({ path: 'cockpit-package-manager-screenshot.png', fullPage: true });
    console.log('Screenshot saved to cockpit-package-manager-screenshot.png');

    // Try to find the Package Manager content
    console.log('Looking for Package Manager content...');

    // Check for error messages
    const errorVisible = await iframe.locator('.pf-v6-c-alert.pf-m-danger').isVisible({ timeout: 2000 }).catch(() => false);
    if (errorVisible) {
      const errorText = await iframe.locator('.pf-v6-c-alert.pf-m-danger').textContent();
      console.error('Error alert found:', errorText);
    }

    // Check if groups are loading
    const groupsVisible = await iframe.locator('[data-testid="group-list"], .group-list, h1, h2').first().isVisible({ timeout: 5000 }).catch(() => false);
    if (groupsVisible) {
      const content = await iframe.locator('body').textContent();
      console.log('Page content preview:', content?.substring(0, 500));
    } else {
      console.warn('No groups or content visible');

      // Get all text content to see what's rendered
      const bodyText = await iframe.locator('body').textContent().catch(() => 'Could not read body');
      console.log('Full body content:', bodyText);
    }

    // Log the page title
    const title = await page.title();
    console.log('Page title:', title);

    // Keep browser open for inspection
    console.log('\n=== Test paused for inspection ===');
    console.log('Press Ctrl+C to exit');
    await page.pause();
  });
});
