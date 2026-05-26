import { expect, Locator, Page } from '@playwright/test';

export class PasswordPage {
  readonly page: Page;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly forgotPasswordButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.passwordInput = page.locator('input[type="password"]');
    this.submitButton = page.locator('button:has-text("تایید و ادامه")');
    this.forgotPasswordButton = page.locator('button:has-text("فراموشی رمز عبور")');
  }

  async fillPassword(password: string) {
    await this.passwordInput.click();
    await this.passwordInput.fill(password);
  }

  async submit() {
    await expect(this.submitButton).toBeEnabled();
    await this.submitButton.click();
  }

  async clickForgotPassword() {
    await this.forgotPasswordButton.click();
  }

  async expectOnPage() {
    await expect(this.passwordInput).toBeVisible();
  }
}
