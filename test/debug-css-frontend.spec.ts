import { test, expect } from '@playwright/test';

const TEST_USERNAME = process.env.TEST_USERNAME;
const TEST_PASSWORD = process.env.TEST_PASSWORD;

if (!TEST_USERNAME || !TEST_PASSWORD) {
  throw new Error('TEST_USERNAME and TEST_PASSWORD environment variables must be set');
}

test('Debug CSS loading', async ({ page, context }) => {
  // Track all network requests
  const requests: Array<{ url: string; status: number; type: string }> = [];
  page.on('response', response => {
    requests.push({
      url: response.url(),
      status: response.status(),
      type: response.request().resourceType()
    });
  });

  // Track console messages
  page.on('console', msg => {
    console.log(`[${msg.type()}] ${msg.text()}`);
  });

  // Navigate and login
  await page.goto('https://halos.local:9090', { waitUntil: 'domcontentloaded', timeout: 30000 });

  const usernameInput = page.getByLabel('User name');
  try {
    await usernameInput.waitFor({ state: 'visible', timeout: 3000 });
    await usernameInput.fill(TEST_USERNAME);
    await page.locator('#login-password-input').fill(TEST_PASSWORD);
    await page.locator('button:has-text("Log in")').click();
    await page.waitForLoadState('networkidle', { timeout: 15000 });
  } catch (e) {
    console.log('Login might have failed or already logged in:', e);
  }

  // Navigate directly to package manager
  await page.goto('https://halos.local:9090/packagemanager', {
    waitUntil: 'networkidle',
    timeout: 15000
  });

  // Wait for iframe
  await page.waitForTimeout(2000);
  const iframe = page.frameLocator('iframe#cockpit1\\:localhost\\/packagemanager');

  // Take screenshot before checking
  await page.screenshot({ path: 'debug-before.png', fullPage: true });

  // Check if CSS file was loaded
  console.log('\n=== Network Requests ===');
  const cssRequests = requests.filter(r => r.url.includes('packagemanager.css'));
  console.log('CSS requests:', cssRequests);

  const jsRequests = requests.filter(r => r.url.includes('packagemanager.js'));
  console.log('JS requests:', jsRequests);

  const allPackageManagerRequests = requests.filter(r => r.url.includes('/packagemanager/'));
  console.log('\nAll package manager requests:');
  allPackageManagerRequests.forEach(r => {
    console.log(`  ${r.status} ${r.type} - ${r.url}`);
  });

  // Check computed styles in the iframe
  const bodyBgColor = await iframe.locator('body').evaluate(el => {
    return window.getComputedStyle(el).backgroundColor;
  });
  console.log('\nBody background color:', bodyBgColor);

  const h1Color = await iframe.locator('h1').first().evaluate(el => {
    return window.getComputedStyle(el).color;
  }).catch(() => 'No h1 found');
  console.log('H1 color:', h1Color);

  // Check if PatternFly classes are styled
  const pfCard = iframe.locator('.pf-v6-c-card').first();
  if (await pfCard.count() > 0) {
    const cardStyles = await pfCard.evaluate(el => {
      const styles = window.getComputedStyle(el);
      return {
        backgroundColor: styles.backgroundColor,
        padding: styles.padding,
        border: styles.border
      };
    });
    console.log('\nPatternFly card styles:', cardStyles);
  } else {
    console.log('\nNo PatternFly cards found');
  }

  // Check all stylesheets loaded
  const stylesheets = await iframe.locator('head').evaluate(() => {
    const sheets = Array.from(document.styleSheets);
    return sheets.map(sheet => ({
      href: sheet.href,
      rulesCount: sheet.cssRules?.length || 0
    }));
  });
  console.log('\nStylesheets loaded in iframe:', stylesheets);

  // Take final screenshot
  await page.screenshot({ path: 'debug-after.png', fullPage: true });

  console.log('\n=== Test paused - press Ctrl+C to exit ===');
  await page.pause();
});
