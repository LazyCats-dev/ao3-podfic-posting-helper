import {test as base, chromium, type BrowserContext} from '@playwright/test';
import path from 'path';

export const test = base.extend<{
  context: BrowserContext;
  extensionId: string;
}>({
  context: async ({}, use) => {
    const pathToExtension = path.join(__dirname, '..', 'dist');
    const context = await chromium.launchPersistentContext('', {
      headless: false,
      args: [
        `--headless=new`,
        `--disable-extensions-except=${pathToExtension}`,
        `--load-extension=${pathToExtension}`,
      ],
    });
    await use(context);
    await context.close();
  },
  extensionId: async ({page}, use) => {
    await page.goto('chrome://extensions');
    const extensionId = await page
      .locator('extensions-item')
      .getAttribute('id');
    await use(extensionId!);
  },
});
export const expect = test.expect;
