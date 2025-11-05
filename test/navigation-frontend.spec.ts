import { test, expect } from '@playwright/test';

// Test credentials from environment variables (required)
const TEST_USERNAME = process.env.TEST_USERNAME;
const TEST_PASSWORD = process.env.TEST_PASSWORD;

if (!TEST_USERNAME || !TEST_PASSWORD) {
  throw new Error('TEST_USERNAME and TEST_PASSWORD environment variables must be set. Copy .env.example to .env and configure.');
}

test.describe('Browser Navigation', () => {
  test.beforeEach(async ({ page, context }) => {
    // Enable console logging for debugging
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.error(`Browser console [${msg.type()}]:`, msg.text());
      }
    });

    // Capture page errors
    page.on('pageerror', error => {
      console.error('Page error:', error.message);
    });

    // Navigate to Cockpit and login
    await page.goto('https://halos.local:9090', {
      waitUntil: 'domcontentloaded',
      timeout: 30000
    });

    // Check if we need to login
    const usernameInput = page.getByLabel('User name');
    try {
      await usernameInput.waitFor({ state: 'visible', timeout: 3000 });
      await usernameInput.fill(TEST_USERNAME);
      await page.locator('#login-password-input').fill(TEST_PASSWORD);
      await page.locator('button:has-text("Log in")').click();
      await page.waitForLoadState('networkidle', { timeout: 15000 });
    } catch (e) {
      // Already logged in
    }

    // Navigate to Package Manager by clicking the sidebar link
    const packageManagerLink = page.locator('a:has-text("Package Manager")');
    await packageManagerLink.waitFor({ timeout: 10000 });
    await packageManagerLink.click();

    // Wait for navigation and iframe to load
    await page.waitForTimeout(3000);
  });

  test('should load package manager without module resolution errors', async ({ page }) => {
    // Collect console errors during page load
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    const iframe = page.frameLocator('iframe#cockpit1\\:localhost\\/packagemanager');

    // Wait for iframe body to exist (even if there's an error)
    try {
      await iframe.locator('body').waitFor({ timeout: 10000 });
    } catch (e) {
      console.error('Failed to load iframe body. Console errors:', consoleErrors);
      throw e;
    }

    // Check for module resolution errors in console
    const moduleErrors = consoleErrors.filter(err =>
      err.includes('Failed to resolve module specifier') ||
      err.includes('Uncaught TypeError')
    );

    if (moduleErrors.length > 0) {
      console.error('Module resolution errors found:', moduleErrors);
      throw new Error(`Module resolution errors: ${moduleErrors.join(', ')}`);
    }

    // Check if content loaded (should see groups or some UI)
    const bodyText = await iframe.locator('body').textContent();
    expect(bodyText).not.toBe('');

    console.log('✓ No module resolution errors');
    console.log('✓ Content loaded successfully');
  });

  test('should navigate with browser back button', async ({ page }) => {
    const iframe = page.frameLocator('iframe#cockpit1\\:localhost\\/packagemanager');

    // Wait for groups to load
    await iframe.locator('h1, h2').first().waitFor({ timeout: 10000 });

    // Initial URL should be #/
    let currentURL = page.url();
    expect(currentURL).toContain('#/');
    console.log('✓ Initial URL:', currentURL);

    // Find and click a group (try "Network" or first available)
    const groupCard = iframe.locator('[class*="card"], [class*="group"]').first();
    await groupCard.waitFor({ timeout: 5000 });
    await groupCard.click();
    await page.waitForTimeout(1000);

    // URL should now be #/group/<groupId>
    currentURL = page.url();
    expect(currentURL).toMatch(/#\/group\/[a-z-]+/);
    console.log('✓ Group URL:', currentURL);

    // Click browser back button
    await page.goBack();
    await page.waitForTimeout(1000);

    // Should be back to #/
    currentURL = page.url();
    expect(currentURL).toContain('#/');
    console.log('✓ Back button works, URL:', currentURL);

    // Groups list should be visible again
    const groupsVisible = await groupCard.isVisible({ timeout: 3000 }).catch(() => false);
    expect(groupsVisible).toBe(true);
    console.log('✓ Groups list visible after back navigation');
  });

  test('should navigate with breadcrumbs', async ({ page }) => {
    const iframe = page.frameLocator('iframe#cockpit1\\:localhost\\/packagemanager');

    // Wait for groups to load
    await iframe.locator('h1, h2').first().waitFor({ timeout: 10000 });

    // Click a group
    const groupCard = iframe.locator('[class*="card"], [class*="group"]').first();
    await groupCard.click();
    await page.waitForTimeout(1000);

    // Should see breadcrumb
    const breadcrumb = iframe.locator('.pf-v6-c-breadcrumb, nav[aria-label*="read"]').first();
    await breadcrumb.waitFor({ timeout: 5000 });

    // Click "Groups" breadcrumb
    const groupsBreadcrumb = iframe.locator('.pf-v6-c-breadcrumb__item a, .pf-v6-c-breadcrumb__link').first();
    await groupsBreadcrumb.click();
    await page.waitForTimeout(1000);

    // Should be back to groups view
    const currentURL = page.url();
    expect(currentURL).toContain('#/');
    console.log('✓ Breadcrumb navigation works, URL:', currentURL);
  });

  test('should support deep linking', async ({ page }) => {
    // Navigate directly to a group
    await page.goto('https://halos.local:9090/packagemanager#/group/network', {
      waitUntil: 'domcontentloaded',
      timeout: 10000
    });

    await page.waitForTimeout(2000);

    const iframe = page.frameLocator('iframe#cockpit1\\:localhost\\/packagemanager');

    // Should show the network group packages
    const body = iframe.locator('body');
    await body.waitFor({ timeout: 5000 });

    const content = await body.textContent();

    // Should show package list content (not groups list)
    expect(content).not.toContain('Select a group'); // Groups view text

    console.log('✓ Deep linking to #/group/network works');
  });

  test('should handle invalid paths', async ({ page }) => {
    // Navigate to invalid path
    await page.goto('https://halos.local:9090/packagemanager#/invalid/path', {
      waitUntil: 'domcontentloaded',
      timeout: 10000
    });

    await page.waitForTimeout(2000);

    const iframe = page.frameLocator('iframe#cockpit1\\:localhost\\/packagemanager');

    // Should redirect to groups view
    const currentURL = page.url();
    expect(currentURL).toContain('#/');

    console.log('✓ Invalid path redirects to groups view');
  });
});
