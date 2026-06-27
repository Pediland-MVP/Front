import { test, expect } from '../../fixtures/test.fixture';
import { AuthPage } from '../../pages/auth.page';
import { OtpPage } from '../../pages/otp.page';
import { OnboardingPage } from '../../pages/onboarding.page';
import { PasswordPage } from '../../pages/password.page';
import { ConnectPage } from '../../pages/connect.page';
import { TEST_USER, TEST_PASSWORD } from '../../helpers/test-data';

test.describe('Login with Password', () => {
  test('existing user with password should log in using password and reach dashboard', async ({
    page,
    testMobile,
    apiHelper,
  }) => {
    const authPage = new AuthPage(page);
    const otpPage = new OtpPage(page);
    const onboardingPage = new OnboardingPage(page);
    const passwordPage = new PasswordPage(page);
    const connectPage = new ConnectPage(page);

    console.log(`[Password Login Test] Registering test user: ${testMobile}`);

    // 1. Register a test user
    await authPage.goto();
    await authPage.fillMobile(testMobile);
    await authPage.submit();

    await page.waitForURL('**/auth/otp');
    await page.waitForTimeout(1000);
    const otp = await apiHelper.getOtp(testMobile);
    await otpPage.fillOtp(otp);

    await page.waitForURL('**/auth/onboarding');
    await onboardingPage.fillForm({
      firstname: TEST_USER.firstname,
      lastname: TEST_USER.lastname,
      instagram: TEST_USER.instagramUsername,
    });
    await onboardingPage.submit();

    await page.waitForURL('**/connect');
    await connectPage.expectOnPage();

    // 2. Set password programmatically on backend
    console.log('[Password Login Test] Setting password programmatically...');
    await apiHelper.setPassword(testMobile, TEST_PASSWORD);

    // 3. Logout
    console.log('[Password Login Test] Logging out...');
    await connectPage.clickLogout();
    await page.waitForURL('**/auth');

    // 4. Log back in (expect password entry page)
    console.log('[Password Login Test] Logging in again with password flow...');
    await authPage.fillMobile(testMobile);
    await authPage.submit();

    // 5. Expect to be redirected to password page
    await page.waitForURL('**/auth/password');
    await passwordPage.expectOnPage();

    // 6. Enter password and submit
    await passwordPage.fillPassword(TEST_PASSWORD);
    await passwordPage.submit();

    // 7. Verify login success and redirect
    await page.waitForTimeout(2000);
    const currentUrl = page.url();
    console.log(`[Password Login Test] Logged in successfully. Redirected to: ${currentUrl}`);
    expect(currentUrl).not.toContain('/auth/password');
    expect(currentUrl).not.toContain('/auth/otp');
  });
});
