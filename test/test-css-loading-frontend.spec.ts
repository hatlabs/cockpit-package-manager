import { test, expect } from '@playwright/test';

test('CSS loading investigation', async ({ page }) => {
  // Collect console messages and errors
  const consoleMessages: string[] = [];
  const errors: string[] = [];

  page.on('console', msg => {
    consoleMessages.push(`[${msg.type()}] ${msg.text()}`);
  });

  page.on('pageerror', error => {
    errors.push(`Page error: ${error.message}`);
  });

  // Navigate to cockpit
  await page.goto('https://halos.local:9090/system', {
    waitUntil: 'networkidle',
    timeout: 60000
  });

  // Login
  await page.fill('input[name="login"]', 'claude');
  await page.fill('input[name="password"]', 'claude123');
  await page.click('button[type="submit"]');

  // Wait for main page
  await page.waitForSelector('iframe', { timeout: 30000 });

  // Navigate to Package Manager
  await page.click('a[href="/packagemanager"]');

  // Wait for iframe
  const iframeElement = await page.waitForSelector('iframe#cockpit1\\:localhost\\/packagemanager', { timeout: 30000 });
  const iframe = await iframeElement.contentFrame();

  if (!iframe) {
    throw new Error('Could not get iframe');
  }

  // Wait for content to load
  await iframe.waitForSelector('body', { timeout: 10000 });

  // Get all stylesheets in the iframe
  const stylesheets = await iframe.evaluate(() => {
    const sheets = Array.from(document.styleSheets);
    return sheets.map(sheet => {
      try {
        return {
          href: sheet.href,
          disabled: sheet.disabled,
          rulesCount: sheet.cssRules ? sheet.cssRules.length : 0,
          error: null
        };
      } catch (e) {
        return {
          href: sheet.href,
          disabled: sheet.disabled,
          rulesCount: 0,
          error: (e as Error).message
        };
      }
    });
  });

  console.log('\n=== Stylesheets in iframe ===');
  console.log(JSON.stringify(stylesheets, null, 2));

  // Check if CSS file is linked
  const cssLinks = await iframe.evaluate(() => {
    const links = Array.from(document.querySelectorAll('link[rel="stylesheet"]'));
    return links.map(link => ({
      href: (link as HTMLLinkElement).href,
      loaded: (link as HTMLLinkElement).sheet !== null
    }));
  });

  console.log('\n=== CSS Link elements ===');
  console.log(JSON.stringify(cssLinks, null, 2));

  // Check computed styles on body
  const bodyStyles = await iframe.evaluate(() => {
    const body = document.body;
    const computed = window.getComputedStyle(body);
    return {
      backgroundColor: computed.backgroundColor,
      fontFamily: computed.fontFamily,
      fontSize: computed.fontSize,
      margin: computed.margin,
      padding: computed.padding
    };
  });

  console.log('\n=== Body computed styles ===');
  console.log(JSON.stringify(bodyStyles, null, 2));

  // Check if any PatternFly classes are applied
  const pfClasses = await iframe.evaluate(() => {
    const allElements = Array.from(document.querySelectorAll('*'));
    const pfElements = allElements.filter(el =>
      Array.from(el.classList).some(cls => cls.startsWith('pf-'))
    );
    return pfElements.slice(0, 10).map(el => ({
      tag: el.tagName,
      classes: Array.from(el.classList).filter(cls => cls.startsWith('pf-'))
    }));
  });

  console.log('\n=== PatternFly classes found ===');
  console.log(JSON.stringify(pfClasses, null, 2));

  // Fetch the CSS file directly and check size
  const cssResponse = await page.request.get('https://halos.local:9090/cockpit/@localhost/packagemanager/packagemanager.css');
  const cssText = await cssResponse.text();
  const cssSize = cssText.length;
  const cssFirstLine = cssText.split('\n')[0];

  console.log('\n=== CSS file fetch ===');
  console.log(`Status: ${cssResponse.status()}`);
  console.log(`Size: ${cssSize} bytes`);
  console.log(`First line: ${cssFirstLine}`);

  // Print any console messages or errors
  if (consoleMessages.length > 0) {
    console.log('\n=== Console messages ===');
    consoleMessages.forEach(msg => console.log(msg));
  }

  if (errors.length > 0) {
    console.log('\n=== Errors ===');
    errors.forEach(err => console.log(err));
  }

  // Take a screenshot
  await page.screenshot({ path: 'css-investigation.png', fullPage: true });

  // Assertions
  expect(cssResponse.status()).toBe(200);
  expect(cssSize).toBeGreaterThan(100000); // Should be >100KB
  expect(cssLinks.length).toBeGreaterThan(0);
});
