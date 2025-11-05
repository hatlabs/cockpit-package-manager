import { test, expect } from '@playwright/test';

test('investigate dark mode issue', async ({ page }) => {
    // Listen for console messages
    page.on('console', msg => {
        console.log(`[Browser Console] ${msg.type()}: ${msg.text()}`);
    });

    // Login to Cockpit first
    console.log('[Test] Logging in to Cockpit...');
    await page.goto('https://halos.local:9090/');

    // Wait for login form
    await page.waitForSelector('#login-user-input', { timeout: 10000 });

    // Fill in credentials
    await page.fill('#login-user-input', process.env.TEST_USERNAME || 'claude');
    await page.fill('#login-password-input', process.env.TEST_PASSWORD || 'claude123');
    await page.click('#login-button');

    // Wait for login to complete
    await page.waitForURL('**/system', { timeout: 10000 });
    console.log('[Test] Login successful');

    // Navigate to Package Manager
    console.log('[Test] Navigating to Package Manager...');
    await page.goto('https://halos.local:9090/packagemanager/', {
        waitUntil: 'networkidle',
        timeout: 30000
    });

    // Wait a bit for everything to load
    await page.waitForTimeout(2000);

    // Get iframe if exists
    const frames = page.frames();
    console.log(`\n[Test] Found ${frames.length} frames`);

    for (let i = 0; i < frames.length; i++) {
        const frame = frames[i];
        console.log(`[Test] Frame ${i}: ${frame.url()}`);
    }

    // Find the package manager iframe
    const packageManagerFrame = page.frameLocator('iframe[name*="cockpit"][src*="packagemanager"]').first();

    // Check if we can access it
    try {
        const html = packageManagerFrame.locator('html');
        const classes = await html.getAttribute('class');
        console.log(`\n[Test] Package Manager iframe html classes: ${classes}`);

        // Check if dark theme class is present
        if (classes?.includes('pf-v6-theme-dark')) {
            console.log('[Test] ✓ Dark theme class IS present in iframe');
        } else {
            console.log('[Test] ✗ Dark theme class NOT present in iframe');
        }
    } catch (e) {
        console.log(`[Test] Cannot access iframe: ${e.message}`);
    }

    // Check parent page
    const parentHtml = page.locator('html');
    const parentClasses = await parentHtml.getAttribute('class');
    console.log(`\n[Test] Parent page html classes: ${parentClasses}`);

    if (parentClasses?.includes('pf-v6-theme-dark')) {
        console.log('[Test] ✓ Parent page HAS dark theme class');
    } else {
        console.log('[Test] ✗ Parent page does NOT have dark theme class');
    }

    // Evaluate cockpit object in main page context
    const cockpitInfo = await page.evaluate(() => {
        return {
            cockpitExists: typeof (window as any).cockpit !== 'undefined',
            cockpitKeys: typeof (window as any).cockpit !== 'undefined'
                ? Object.keys((window as any).cockpit).slice(0, 20)
                : [],
            darkMode: typeof (window as any).cockpit !== 'undefined'
                ? (window as any).cockpit.dark_mode
                : undefined
        };
    });

    console.log('\n[Test] Main page cockpit object:');
    console.log(`  - exists: ${cockpitInfo.cockpitExists}`);
    console.log(`  - dark_mode: ${cockpitInfo.darkMode}`);
    console.log(`  - keys: ${cockpitInfo.cockpitKeys.join(', ')}`);

    // Take a screenshot
    await page.screenshot({ path: '/tmp/dark-mode-debug.png', fullPage: true });
    console.log('\n[Test] Screenshot saved to /tmp/dark-mode-debug.png');
});
