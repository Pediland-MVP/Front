import { test as base } from './test.fixture';
import { Page } from '@playwright/test';
import { AuthPage } from '../pages/auth.page';
import { OtpPage } from '../pages/otp.page';
import { OnboardingPage } from '../pages/onboarding.page';
import { TEST_USER } from '../helpers/test-data';

type AuthFixtures = {
  authenticatedPage: Page;
};

export const testWithAuth = base.extend<AuthFixtures>({
  authenticatedPage: async ({ page, testMobile, apiHelper }, use) => {
    console.log(`[Auth Fixture] Performing background authentication for: ${testMobile}`);

    const authPage = new AuthPage(page);
    const otpPage = new OtpPage(page);
    const onboardingPage = new OnboardingPage(page);

    // 1. Go to signup/login page
    await authPage.goto();
    await authPage.fillMobile(testMobile);
    await authPage.submit();

    // 2. Retrieve OTP and submit
    await otpPage.expectOnPage();
    // Wait slightly for Redis to write
    await page.waitForTimeout(1000);
    const otp = await apiHelper.getOtp(testMobile);
    await otpPage.fillOtp(otp);

    // 3. Complete onboarding
    await onboardingPage.expectOnPage();
    await onboardingPage.fillForm({
      firstname: TEST_USER.firstname,
      lastname: TEST_USER.lastname,
      instagram: TEST_USER.instagramUsername,
    });
    await onboardingPage.submit();

    // Now the browser context is fully authenticated and on /connect page
    await page.waitForURL('**/connect');

    // Yield the authenticated page to the test
    await use(page);
  },
});
