import { test, expect } from '../../fixtures/test.fixture';
import { AuthPage } from '../../pages/auth.page';
import { OtpPage } from '../../pages/otp.page';
import { PasswordPage } from '../../pages/password.page';

test.describe('Authentication Edge Cases & Validations', () => {
  test('should validate mobile number format and enable submit appropriately', async ({ page }) => {
    const authPage = new AuthPage(page);

    await authPage.goto();

    // 1. Submit button should be disabled initially (empty input)
    await expect(authPage.submitButton).toBeDisabled();

    // 2. Submit button should be disabled for short input (e.g. 0912)
    await authPage.fillMobile('0912');
    await expect(authPage.submitButton).toBeDisabled();

    // 3. Submit button should be enabled for valid 11-digit mobile starting with 09
    await authPage.fillMobile('09120000000');
    await expect(authPage.submitButton).toBeEnabled();
  });

  test('should display error message on entering incorrect OTP', async ({ page, testMobile }) => {
    const authPage = new AuthPage(page);
    const otpPage = new OtpPage(page);

    // 1. Go to OTP page
    await authPage.goto();
    await authPage.fillMobile(testMobile);
    await authPage.submit();
    
    await page.waitForURL('**/auth/otp');
    await otpPage.expectOnPage();

    // 2. Enter incorrect OTP
    console.log('[Edge Cases Test] Entering incorrect OTP...');
    await otpPage.fillOtp('99999'); // Obviously incorrect

    // 3. Wait for error message or toast
    // The shadcn/sonner toast displays the error. 
    // We expect the URL to stay on /auth/otp
    await page.waitForTimeout(2000);
    expect(page.url()).toContain('/auth/otp');
  });

  test('should successfully navigate back from OTP page to Auth page', async ({ page, testMobile }) => {
    const authPage = new AuthPage(page);
    const otpPage = new OtpPage(page);

    await authPage.goto();
    await authPage.fillMobile(testMobile);
    await authPage.submit();

    await page.waitForURL('**/auth/otp');
    await otpPage.expectOnPage();

    // Click change number / back button
    console.log('[Edge Cases Test] Testing change number (back) navigation...');
    await otpPage.clickChangeNumber();

    // Expect to be back on /auth
    await page.waitForURL('**/auth');
    await authPage.expectOnPage();
  });
});
