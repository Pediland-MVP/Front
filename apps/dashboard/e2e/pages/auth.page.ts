import { expect, Locator, Page } from '@playwright/test';

export class AuthPage {
  readonly page: Page;
  readonly mobileInput: Locator;
  readonly submitButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.mobileInput = page.locator('input[inputmode="numeric"]');
    this.submitButton = page.locator('button:has-text("تایید و ادامه")'); // Arabic/Persian text "تایید و ادامه" or using test:e2e dynamic translations
  }

  async goto() {
    await this.page.goto('/auth');
    await this.expectOnPage();
  }

  async fillMobile(mobile: string) {
    await this.mobileInput.click();
    await this.mobileInput.fill(mobile);
  }

  async submit() {
    await expect(this.submitButton).toBeEnabled();
    await this.submitButton.click();
  }

  async expectOnPage() {
    await expect(this.mobileInput).toBeVisible();
  }
}
