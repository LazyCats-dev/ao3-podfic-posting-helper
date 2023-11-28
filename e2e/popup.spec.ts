import {test, expect} from './fixture';

test('options page', async ({page, extensionId}) => {
  await page.goto(`chrome-extension://${extensionId}/options.html`);
  await expect(page.locator('header.app-bar')).toContainText(
    'AO3 Podfic Posting Helper Extension Options'
  );
});
