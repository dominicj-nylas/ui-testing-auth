// playwright-extra is a drop-in replacement for playwright,
// it augments the installed playwright with plugin functionality
import { chromium } from 'playwright-extra';
// Load the stealth plugin and use defaults (all tricks to hide playwright usage)
// Note: playwright-extra is compatible with most puppeteer-extra plugins
import stealth from 'puppeteer-extra-plugin-stealth';

import { baseURL } from '../playwright.config';
import { testUser } from './test-user';

// Add the plugin to playwright
chromium.use(stealth);

async function globalSetup(): Promise<void> {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  await page.goto(`${baseURL}/user/login`);
  // There is a redirect to Google auth form
  await page.getByText('Google').click();
  // Parse https://accounts.google.com/ page
  const html = await page.locator('body').innerHTML();

  // Determine type of Google sign in form
  if (html.includes('aria-label="Google"')) {
    // Old Google sign in form
    await page.fill('#Email', testUser.login);
    await page.locator('#next').click();
    await page.fill('#password', testUser.password);
    await page.locator('#submit').click();
  } else {
    // New Google sign in form
    await page.fill('input[type="email"]', testUser.login);
    await page.locator('#identifierNext >> button').click();
    await page.fill('#password >> input[type="password"]', testUser.password);
    await page.locator('button >> nth=1').click();
  }

  // Wait for redirect back to home page
  await page.waitForURL(`${baseURL}/?check_logged_in=1`);
  // Save state https://playwright.dev/docs/api/class-apirequestcontext#api-request-context-storage-state
  await page.context().storageState({ path: './setup/storage-state.json' });
  await browser.close();
}

export default globalSetup;
