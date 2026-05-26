import { expect, Locator, Page } from '@playwright/test';

export class ConnectPage {
  readonly page: Page;
  readonly connectButton: Locator;
  readonly copyLinkButton: Locator;
  readonly logoutButton: Locator;
  readonly mobileDisplay: Locator;
  readonly instagramDisplay: Locator;

  constructor(page: Page) {
    this.page = page;
    // Connect button containing the Farsi text "اتصال اکانت" or link to Instagram OAuth
    this.connectButton = page.locator('a:has-text("اتصال اکانت")');
    this.copyLinkButton = page.locator('button:has-text("کپی لینک اتصال")');
    this.logoutButton = page.locator('header svg').first(); // The SignOutIcon SVG in the header
    this.mobileDisplay = page.locator('text=شماره موبایل'); // Farsi "شماره موبایل"
    this.instagramDisplay = page.locator('text=اینستاگرام'); // Farsi "اینستاگرام"
  }

  async clickConnect() {
    await this.connectButton.click();
  }

  async clickCopyLink() {
    await this.copyLinkButton.click();
  }

  async clickLogout() {
    await this.logoutButton.click();
  }

  async getOAuthUrl(): Promise<string | null> {
    return await this.connectButton.getAttribute('href');
  }

  async expectOnPage() {
    await expect(this.connectButton).toBeVisible();
  }
}
