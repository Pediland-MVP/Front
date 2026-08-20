import { testWithAuth } from '../../fixtures/auth.fixture';
import { expect } from '../../fixtures/test.fixture';

// The page id we expect to be forwarded into the subscribe POST body.
const TEST_INSTAGRAM_ID = '22222222-2222-2222-2222-222222222222';

const PLAN_ID = 7;
const DURATION_ID = 101;

// Exact fa string from src/messages/fa.json -> Subscription.buy
const BUY_BUTTON_TEXT = 'خـریـد';

testWithAuth.describe('Settings - Page-targeted subscription purchase', () => {
  testWithAuth(
    'forwards instagramId in the /subscriptions/subscribe POST body when buying from a targeted URL',
    async ({ authenticatedPage }) => {
      // The subscription page is gated by can('billing:view'); ChoosePlan also reads
      // permissions. Stub the effective-permissions endpoint so it is granted.
      await authenticatedPage.route('**/permissions/members/me/effective*', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            statusCode: 200,
            message: 'OK',
            data: [{ slug: 'billing:view' }, { slug: 'instagram:view' }],
          }),
        });
      });

      // No subscriptions yet -> ChoosePlan opens (active.choosePlan = true).
      await authenticatedPage.route(/\/subscriptions\?/, async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ items: [], meta: { totalItems: 0 } }),
        });
      });

      // One plan with one purchasable duration so a single buy button renders.
      await authenticatedPage.route('**/plans*', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            statusCode: 200,
            message: 'OK',
            data: {
              plans: [
                {
                  id: PLAN_ID,
                  createDate: '2026-01-01T00:00:00.000Z',
                  updateDate: '2026-01-01T00:00:00.000Z',
                  isActive: true,
                  name: 'پلن تست',
                  description: 'plan for e2e',
                  minFollowers: 0,
                  maxFollowers: 10000,
                  features: [],
                  durations: [
                    {
                      id: DURATION_ID,
                      planId: PLAN_ID,
                      name: 'یک ماهه',
                      durationDays: 30,
                      price: 100000,
                      discountPrice: 0,
                      monthlyDiscount: null,
                      createDate: '2026-01-01T00:00:00.000Z',
                      updateDate: '2026-01-01T00:00:00.000Z',
                    },
                  ],
                },
              ],
              discount: { haveDiscount: false },
            },
          }),
        });
      });

      // Intercept the subscribe POST and answer with a free-payment result so the
      // app stays on the page (no redirect to a payment gateway link).
      await authenticatedPage.route('**/subscriptions/subscribe', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            statusCode: 200,
            message: 'OK',
            code: 'PAID_FREE',
            data: {},
          }),
        });
      });

      await authenticatedPage.goto(`/settings/subscription?instagramId=${TEST_INSTAGRAM_ID}`);

      // Wait for the buy button (renders once plans + permissions resolve).
      const buyButton = authenticatedPage.getByRole('button', { name: BUY_BUTTON_TEXT }).first();
      await expect(buyButton).toBeVisible();

      // Click and capture the outgoing subscribe request.
      const [subscribeRequest] = await Promise.all([
        authenticatedPage.waitForRequest('**/subscriptions/subscribe'),
        buyButton.click(),
      ]);

      const body = subscribeRequest.postDataJSON();
      expect(body).toMatchObject({
        planId: PLAN_ID,
        durationId: DURATION_ID,
        instagramId: TEST_INSTAGRAM_ID,
      });
    },
  );
});
