import { expect, Locator, Page } from '@playwright/test';

export class OtpPage {
  readonly page: Page;
  readonly changeNumberButton: Locator;
  readonly submitButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.changeNumberButton = page.locator('button:has-text("تغییر شماره")');
    this.submitButton = page.locator('button:has-text("تایید و ادامه")');
  }

  async fillOtp(otp: string) {
    // Shadcn InputOTP renders a hidden or styled input under the hood.
    // We click the container/first slot to focus it, then type the OTP.
    const container = this.page
      .locator('.flex-row-reverse, .flex-row')
      .filter({ has: this.page.locator('input') })
      .first();
    if (await container.isVisible()) {
      await container.click();
    } else {
      await this.page.locator('input').first().click();
    }

    // Type the digits one by one to ensure events fire correctly
    for (const char of otp) {
      await this.page.keyboard.press(char);
      await this.page.waitForTimeout(100);
    }
  }

  async clickChangeNumber() {
    await this.changeNumberButton.click();
  }

  async expectOnPage() {
    // Checks that the OTP page header is present
    await expect(this.page.locator('h1:has-text("کد تایید")')).toBeVisible();
  }
}
