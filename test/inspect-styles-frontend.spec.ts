import { test, expect } from '@playwright/test';

const TEST_USERNAME = process.env.TEST_USERNAME;
const TEST_PASSWORD = process.env.TEST_PASSWORD;

if (!TEST_USERNAME || !TEST_PASSWORD) {
  throw new Error('TEST_USERNAME and TEST_PASSWORD environment variables must be set');
}

test('Inspect CSS application', async ({ page }) => {
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
    console.log('Login might have failed or already logged in');
  }

  // Navigate to package manager
  await page.goto('https://halos.local:9090/packagemanager', {
    waitUntil: 'domcontentloaded',
    timeout: 15000
  });

  await page.waitForTimeout(3000);

  // Get iframe
  const iframe = page.frameLocator('iframe#cockpit1\\:localhost\\/packagemanager');

  // Check if stylesheets are loaded
  const styleInfo = await iframe.locator('html').evaluate(() => {
    const sheets = Array.from(document.styleSheets);
    return sheets.map(sheet => {
      try {
        return {
          href: sheet.href,
          disabled: sheet.disabled,
          rulesCount: sheet.cssRules?.length || 0,
          media: sheet.media.mediaText
        };
      } catch (e) {
        return {
          href: sheet.href,
          error: 'Cannot access cssRules (might be CORS issue)',
          disabled: sheet.disabled
        };
      }
    });
  });

  console.log('\n=== Stylesheets Info ===');
  console.log(JSON.stringify(styleInfo, null, 2));

  // Check if link tag exists
  const linkTags = await iframe.locator('head link[rel="stylesheet"]').evaluateAll(links => {
    return links.map(link => ({
      href: link.getAttribute('href'),
      loaded: link.sheet !== null,
      disabled: link.disabled
    }));
  });

  console.log('\n=== Link Tags ===');
  console.log(JSON.stringify(linkTags, null, 2));

  // Check computed styles on body
  const bodyStyles = await iframe.locator('body').evaluate(el => {
    const styles = window.getComputedStyle(el);
    return {
      backgroundColor: styles.backgroundColor,
      fontFamily: styles.fontFamily,
      fontSize: styles.fontSize,
      color: styles.color,
      margin: styles.margin,
      padding: styles.padding
    };
  });

  console.log('\n=== Body Computed Styles ===');
  console.log(JSON.stringify(bodyStyles, null, 2));

  // Check if PatternFly classes exist
  const pfClasses = await iframe.locator('body').evaluate(() => {
    const allElements = Array.from(document.querySelectorAll('*'));
    const pfElements = allElements.filter(el =>
      Array.from(el.classList).some(c => c.startsWith('pf-'))
    );
    return {
      totalElements: allElements.length,
      pfElements: pfElements.length,
      sampleClasses: pfElements.slice(0, 5).map(el => Array.from(el.classList).join(' '))
    };
  });

  console.log('\n=== PatternFly Classes ===');
  console.log(JSON.stringify(pfClasses, null, 2));

  // Check if there's actual CSS content loaded
  const cssContent = await iframe.locator('html').evaluate(() => {
    const sheets = Array.from(document.styleSheets);
    if (sheets.length === 0) return 'No stylesheets found';

    const sheet = sheets[0];
    try {
      const rules = Array.from(sheet.cssRules || []);
      return {
        firstFewRules: rules.slice(0, 3).map(rule => rule.cssText),
        totalRules: rules.length
      };
    } catch (e) {
      return { error: e.toString() };
    }
  });

  console.log('\n=== CSS Content Sample ===');
  console.log(JSON.stringify(cssContent, null, 2));

  // Take screenshot
  await page.screenshot({ path: 'inspect-styles.png', fullPage: true });

  console.log('\n=== Paused for inspection ===');
  await page.pause();
});
