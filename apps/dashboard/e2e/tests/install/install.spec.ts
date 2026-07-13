import { testWithAuth } from '../../fixtures/auth.fixture';
import { expect } from '../../fixtures/test.fixture';

const ANDROID_UA =
  'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36';
const IOS_UA =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';
const DESKTOP_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

testWithAuth.describe('Install page', () => {
  testWithAuth.describe('on an Android user agent', () => {
    testWithAuth.use({ userAgent: ANDROID_UA });

    testWithAuth('shows only the Android install card', async ({ authenticatedPage }) => {
      await authenticatedPage.goto('/install');
      await expect(authenticatedPage.getByTestId('install-android-card')).toBeVisible();
      await expect(authenticatedPage.getByTestId('install-ios-card')).toHaveCount(0);
    });
  });

  testWithAuth.describe('on an iOS user agent', () => {
    testWithAuth.use({ userAgent: IOS_UA });

    testWithAuth('shows only the iOS install card', async ({ authenticatedPage }) => {
      await authenticatedPage.goto('/install');
      await expect(authenticatedPage.getByTestId('install-ios-card')).toBeVisible();
      await expect(authenticatedPage.getByTestId('install-android-card')).toHaveCount(0);
    });
  });

  testWithAuth.describe('on a desktop user agent', () => {
    testWithAuth.use({ userAgent: DESKTOP_UA });

    testWithAuth('shows both install cards', async ({ authenticatedPage }) => {
      await authenticatedPage.goto('/install');
      await expect(authenticatedPage.getByTestId('install-android-card')).toBeVisible();
      await expect(authenticatedPage.getByTestId('install-ios-card')).toBeVisible();
    });
  });

  testWithAuth('sidebar link navigates to /install', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/');
    await authenticatedPage.getByRole('link', { name: 'نصب اپلیکیشن' }).click();
    await authenticatedPage.waitForURL('**/install');
  });
});
