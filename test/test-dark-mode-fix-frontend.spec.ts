import { test, expect } from '@playwright/test';

test('verify dark mode works after fix', async ({ page }) => {
    // Login to Cockpit
    console.log('[Test] Logging in...');
    await page.goto('https://halos.local:9090/');
    await page.waitForSelector('#login-user-input', { timeout: 10000 });
    await page.fill('#login-user-input', process.env.TEST_USERNAME || 'claude');
    await page.fill('#login-password-input', process.env.TEST_PASSWORD || 'claude123');
    await page.click('#login-button');
    await page.waitForURL('**/system', { timeout: 10000 });

    // Navigate to Package Manager
    console.log('[Test] Navigating to Package Manager...');
    await page.goto('https://halos.local:9090/packagemanager/');
    await page.waitForTimeout(2000);

    // Check initial state (light mode)
    const packageManagerFrame = page.frameLocator('iframe[src*="packagemanager"]').first();
    const iframeHtml = packageManagerFrame.locator('html');

    let classes = await iframeHtml.getAttribute('class');
    console.log(`\n[Test] Initial iframe classes: ${classes}`);

    // Manually add dark theme class to parent (simulating user toggle)
    console.log('[Test] Adding dark theme class to parent...');
    await page.evaluate(() => {
        document.documentElement.classList.add('pf-v6-theme-dark');
    });

    // Wait a bit for MutationObserver to react
    await page.waitForTimeout(500);

    // Check if iframe inherited the dark theme
    classes = await iframeHtml.getAttribute('class');
    console.log(`[Test] After adding parent dark class, iframe classes: ${classes}`);

    if (classes?.includes('pf-v6-theme-dark')) {
        console.log('[Test] ✓ SUCCESS: Iframe inherited dark theme class!');
    } else {
        console.log('[Test] ✗ FAIL: Iframe did NOT inherit dark theme class');
        throw new Error('Dark mode inheritance failed');
    }

    // Remove dark theme from parent
    console.log('\n[Test] Removing dark theme class from parent...');
    await page.evaluate(() => {
        document.documentElement.classList.remove('pf-v6-theme-dark');
    });

    await page.waitForTimeout(500);

    // Check if iframe removed the dark theme
    classes = await iframeHtml.getAttribute('class');
    console.log(`[Test] After removing parent dark class, iframe classes: ${classes}`);

    if (!classes?.includes('pf-v6-theme-dark')) {
        console.log('[Test] ✓ SUCCESS: Iframe removed dark theme class!');
    } else {
        console.log('[Test] ✗ FAIL: Iframe still has dark theme class');
        throw new Error('Dark mode removal failed');
    }

    console.log('\n[Test] ✓ All dark mode tests passed!');
});
