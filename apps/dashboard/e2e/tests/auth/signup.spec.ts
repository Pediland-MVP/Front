import { test, expect } from '../../fixtures/test.fixture';
import { AuthPage } from '../../pages/auth.page';
import { OtpPage } from '../../pages/otp.page';
import { OnboardingPage } from '../../pages/onboarding.page';
import { ConnectPage } from '../../pages/connect.page';
import { TEST_USER } from '../../helpers/test-data';

test.describe('Signup Flow (New User)', () => {
  test('should successfully complete signup from mobile entry to connect page', async ({ page, testMobile, apiHelper }) => {
    const authPage = new AuthPage(page);
    const otpPage = new OtpPage(page);
    const onboardingPage = new OnboardingPage(page);
    const connectPage = new ConnectPage(page);

    console.log(`[Signup Test] Starting signup flow for mobile: ${testMobile}`);

    // 1. Enter mobile on Auth page
    await authPage.goto();
    await authPage.fillMobile(testMobile);
    await authPage.submit();

    // 2. Expect to navigate to OTP page
    await page.waitForURL('**/auth/otp');
    await otpPage.expectOnPage();

    // 3. Fetch OTP from backend helper API and enter it
    // Wait slightly to ensure OTP is stored in Redis
    await page.waitForTimeout(1000);
    const otp = await apiHelper.getOtp(testMobile);
    expect(otp).toBeDefined();
    expect(otp.length).toBe(5);

    console.log(`[Signup Test] Retrieved OTP: ${otp}`);
    await otpPage.fillOtp(otp);

    // 4. Expect auto-redirect to onboarding page
    await page.waitForURL('**/auth/onboarding');
    await onboardingPage.expectOnPage();

    // 5. Complete onboarding form
    console.log('[Signup Test] Filling onboarding details...');
    await onboardingPage.fillForm({
      firstname: TEST_USER.firstname,
      lastname: TEST_USER.lastname,
      instagram: TEST_USER.instagramUsername,
    });
    await onboardingPage.submit();

    // 6. Expect redirect to Connect page
    await page.waitForURL('**/connect');
    await connectPage.expectOnPage();

    // 7. Verify connect page details match the test user
    await expect(page.locator('body')).toContainText(testMobile);
    await expect(page.locator('body')).toContainText(TEST_USER.instagramUsername);

    console.log('[Signup Test] Signup successfully verified!');
  });
});
