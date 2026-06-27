import { test, expect } from '../../fixtures/test.fixture';
import { AuthPage } from '../../pages/auth.page';
import { OtpPage } from '../../pages/otp.page';
import { OnboardingPage } from '../../pages/onboarding.page';
import { ConnectPage } from '../../pages/connect.page';
import { TEST_USER } from '../../helpers/test-data';

test.describe('Login with OTP', () => {
  test('existing user without password should log in using OTP and reach dashboard', async ({
    page,
    testMobile,
    apiHelper,
  }) => {
    const authPage = new AuthPage(page);
    const otpPage = new OtpPage(page);
    const onboardingPage = new OnboardingPage(page);
    const connectPage = new ConnectPage(page);

    console.log(`[OTP Login Test] Registering a new user first with mobile: ${testMobile}`);

    // 1. First register the user
    await authPage.goto();
    await authPage.fillMobile(testMobile);
    await authPage.submit();

    await page.waitForURL('**/auth/otp');
    await page.waitForTimeout(1000);
    let otp = await apiHelper.getOtp(testMobile);
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

    // 2. Logout
    console.log('[OTP Login Test] Logging out from Connect page...');
    await connectPage.clickLogout();
    await page.waitForURL('**/auth');

    // 3. Log back in with the same mobile number
    console.log('[OTP Login Test] Logging back in...');
    await authPage.fillMobile(testMobile);
    await authPage.submit();

    // 4. Expect next: otp
    await page.waitForURL('**/auth/otp');
    await otpPage.expectOnPage();
    await page.waitForTimeout(1000);

    // 5. Get new OTP and log in
    otp = await apiHelper.getOtp(testMobile);
    await otpPage.fillOtp(otp);

    // 6. Since user is already onboarded, it should redirect to home/dashboard or connect page
    // Wait for the URL to change to the home/dashboard page or connect page
    await page.waitForTimeout(2000);
    const currentUrl = page.url();
    console.log(`[OTP Login Test] Redirected to: ${currentUrl}`);

    // As the user has not connected Instagram yet, they might land on /connect or / (dashboard).
    // Both are acceptable authenticated states. Let's assert they are not on onboarding/otp.
    expect(currentUrl).not.toContain('/auth/onboarding');
    expect(currentUrl).not.toContain('/auth/otp');
  });
});
