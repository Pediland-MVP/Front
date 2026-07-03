import { testWithAuth } from '../../fixtures/auth.fixture';
import { expect } from '../../fixtures/test.fixture';

// A fixed Instagram page id we control so we can assert it travels into the buy URL.
const TEST_INSTAGRAM_ID = '11111111-1111-1111-1111-111111111111';

// Exact fa strings from src/messages/fa.json -> Settings.Accounts
const PROMOTION_ALERT_TEXT =
  'این پیج اشتراک فعال ندارد؛ تبلیغ بفروش در پایان پیام‌های خودکار نمایش داده می‌شود.';
const PROMOTION_CTA_TEXT = 'خرید پلن برای این پیج';

// Build one accounts payload row. InstagramAccounts only renders when the first
// row has isIgTokenValid === true, and shows PagePromotionAlert when isPromotion === true.
function accountRow(overrides: Record<string, unknown> = {}) {
  return {
    id: TEST_INSTAGRAM_ID,
    createDate: '2026-01-01T00:00:00.000Z',
    updateDate: '2026-01-01T00:00:00.000Z',
    instagramId: '17841400000000000',
    facebookAccountId: 'fb_acc_1',
    facebookPageId: 'fb_page_1',
    name: 'Befroosh E2E Page',
    firstname: 'Bef',
    lastname: 'Roosh',
    email: null,
    username: 'befroosh_e2e',
    profileUrl: 'https://instagram.com/befroosh_e2e',
    profilePictureUrl: null,
    isIgTokenValid: true,
    isPromotion: true,
    ...overrides,
  };
}

testWithAuth.describe('Settings - Page Promotion Alert', () => {
  // usePermissions decodes the workspaceId from the in-memory access token (repopulated
  // by the real 401 -> refresh-token flow after navigation), then loads effective
  // permissions. We stub that endpoint so the page reliably grants instagram:view/manage.
  async function stubPermissions(page: import('@playwright/test').Page) {
    await page.route('**/permissions/members/me/effective*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          statusCode: 200,
          message: 'OK',
          data: [{ slug: 'instagram:view' }, { slug: 'instagram:manage' }],
        }),
      });
    });
  }

  testWithAuth(
    'renders the promotion alert for a page without an active subscription and navigates to the targeted buy URL',
    async ({ authenticatedPage }) => {
      await stubPermissions(authenticatedPage);

      // Stub the accounts list with a single promotion-eligible page.
      await authenticatedPage.route('**/instagram/accounts', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            statusCode: 200,
            message: 'OK',
            data: [accountRow({ isPromotion: true })],
          }),
        });
      });

      await authenticatedPage.goto('/settings/instagram');

      // The promotion alert and its CTA must be visible.
      await expect(authenticatedPage.getByText(PROMOTION_ALERT_TEXT)).toBeVisible();
      const cta = authenticatedPage.getByRole('button', { name: PROMOTION_CTA_TEXT });
      await expect(cta).toBeVisible();

      // Clicking the CTA must navigate to the subscription page carrying the page id.
      await cta.click();
      await authenticatedPage.waitForURL(
        `**/settings/subscription?instagramId=${TEST_INSTAGRAM_ID}`,
      );
      expect(authenticatedPage.url()).toContain(
        `/settings/subscription?instagramId=${TEST_INSTAGRAM_ID}`,
      );
    },
  );

  testWithAuth(
    'does NOT render the promotion alert for a page that is not promotion-eligible',
    async ({ authenticatedPage }) => {
      await stubPermissions(authenticatedPage);

      // Same page, but isPromotion is false -> no alert should render.
      await authenticatedPage.route('**/instagram/accounts', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            statusCode: 200,
            message: 'OK',
            data: [accountRow({ isPromotion: false })],
          }),
        });
      });

      await authenticatedPage.goto('/settings/instagram');

      // The account card itself renders (proves the list loaded)...
      await expect(authenticatedPage.getByText('@befroosh_e2e')).toBeVisible();
      // ...but the promotion alert and CTA must be absent.
      await expect(authenticatedPage.getByText(PROMOTION_ALERT_TEXT)).toHaveCount(0);
      await expect(authenticatedPage.getByRole('button', { name: PROMOTION_CTA_TEXT })).toHaveCount(
        0,
      );
    },
  );
});
