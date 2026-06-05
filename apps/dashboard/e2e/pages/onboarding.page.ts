import { expect, Locator, Page } from '@playwright/test';

export class OnboardingPage {
  readonly page: Page;
  readonly firstnameInput: Locator;
  readonly lastnameInput: Locator;
  readonly instagramInput: Locator;
  readonly referralSwitch: Locator;
  readonly referralInput: Locator;
  readonly submitButton: Locator;
  readonly cancelButton: Locator;

  constructor(page: Page) {
    this.page = page;
    // Locators based on default Persian placeholders/texts
    this.firstnameInput = page.locator('input[placeholder="نام"]');
    this.lastnameInput = page.locator('input[placeholder="نام خانوادگی"]');
    this.instagramInput = page.locator('input[placeholder="آیدی اینستاگرام"]');
    this.referralSwitch = page.locator('button[role="switch"]');
    this.referralInput = page.locator('input[placeholder="کد معرف"]');
    this.submitButton = page.locator('button:has-text("تایید و ادامه")');
    this.cancelButton = page.locator('button:has-text("انصراف از ثبت نام")');
  }

  async fillForm(data: { firstname: string; lastname: string; instagram: string; referralCode?: string }) {
    await this.firstnameInput.fill(data.firstname);
    await this.lastnameInput.fill(data.lastname);
    await this.instagramInput.fill(data.instagram);

    if (data.referralCode) {
      await this.referralSwitch.click();
      await this.referralInput.fill(data.referralCode);
    }
  }

  async submit() {
    await expect(this.submitButton).toBeEnabled();
    await this.submitButton.click();
  }

  async cancel() {
    await this.cancelButton.click();
  }

  async expectOnPage() {
    await expect(this.firstnameInput).toBeVisible();
  }
}
