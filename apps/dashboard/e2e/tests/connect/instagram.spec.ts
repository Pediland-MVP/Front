import { testWithAuth } from '../../fixtures/auth.fixture';
import { expect } from '../../fixtures/test.fixture';
import { ConnectPage } from '../../pages/connect.page';

testWithAuth.describe('Instagram Connection Flow', () => {
  testWithAuth(
    'should render connect page with correct elements',
    async ({ authenticatedPage }) => {
      const connectPage = new ConnectPage(authenticatedPage);

      // 1. We should be on /connect
      await connectPage.expectOnPage();

      // 2. Check the oauth link contains necessary parameters
      const oauthUrl = await connectPage.getOAuthUrl();
      expect(oauthUrl).toBeDefined();
      expect(oauthUrl).toContain('instagram.com/oauth/authorize');
      expect(oauthUrl).toContain('client_id=');
      expect(oauthUrl).toContain('response_type=code');
    },
  );

  testWithAuth(
    'should simulate successful Instagram connection via callback interception',
    async ({ authenticatedPage }) => {
      const connectPage = new ConnectPage(authenticatedPage);
      await connectPage.expectOnPage();

      // Intercept the callbackIG API call to simulate a successful link
      console.log('[Instagram Test] Intercepting callbackIG API endpoint...');
      await authenticatedPage.route('**/instagram/callbackIG*', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            statusCode: 200,
            message: 'Instagram connected successfully',
            data: { success: true },
          }),
        });
      });

      // Also mock /users/me or SWR mutations if they trigger to represent connected state
      await authenticatedPage.route('**/users/me', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            statusCode: 200,
            data: {
              status: 'active',
              submittedInstagramUsername: 'befroosh_e2e_test',
            },
          }),
        });
      });

      // Simulate Instagram redirect back to frontend with a code
      console.log('[Instagram Test] Navigating to redirect callback URL...');
      await authenticatedPage.goto('/connect?code=mock_instagram_auth_code_123');

      // The page should detect the query parameter, call the API, and redirect to dashboard '/'
      await authenticatedPage.waitForURL('**/');
      const currentUrl = authenticatedPage.url();
      console.log(`[Instagram Test] Callback succeeded. Navigated to: ${currentUrl}`);
      expect(currentUrl).not.toContain('/connect');
    },
  );

  testWithAuth(
    'should show NO_ACTIVE_SUBSCRIPTION error toast when callbackIG returns that code',
    async ({ authenticatedPage }) => {
      const connectPage = new ConnectPage(authenticatedPage);
      await connectPage.expectOnPage();

      // Intercept callbackIG to simulate the user having no active subscription for this page
      console.log('[Instagram Test] Intercepting callbackIG to return NO_ACTIVE_SUBSCRIPTION...');
      await authenticatedPage.route('**/instagram/callbackIG*', async (route) => {
        await route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({
            code: 'NO_ACTIVE_SUBSCRIPTION',
            error: 'Bad Request',
            message: 'No active subscription for this page',
            statusCode: 400,
          }),
        });
      });

      // Simulate Instagram redirect back to the frontend with a mock auth code
      await authenticatedPage.goto('/connect?code=mock_instagram_auth_code_123');

      // The user must stay on /connect — no redirect to dashboard
      await expect(connectPage.connectButton).toBeVisible();

      // Error toast must appear with the Persian error message for NO_ACTIVE_SUBSCRIPTION
      await expect(
        authenticatedPage.getByText('برای این پیج اشتراک فعالی وجود ندارد. لطفاً یک پلن بخرید.'),
      ).toBeVisible();
    },
  );

  testWithAuth(
    'should show SUBSCRIPTION_ALREADY_BOUND error toast when callbackIG returns that code',
    async ({ authenticatedPage }) => {
      const connectPage = new ConnectPage(authenticatedPage);
      await connectPage.expectOnPage();

      // Intercept callbackIG to simulate the user's active subscription being bound to another page
      console.log(
        '[Instagram Test] Intercepting callbackIG to return SUBSCRIPTION_ALREADY_BOUND...',
      );
      await authenticatedPage.route('**/instagram/callbackIG*', async (route) => {
        await route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({
            code: 'SUBSCRIPTION_ALREADY_BOUND',
            error: 'Bad Request',
            message: 'Active subscription is already bound to another page',
            statusCode: 400,
          }),
        });
      });

      // Simulate Instagram redirect back to the frontend with a mock auth code
      await authenticatedPage.goto('/connect?code=mock_instagram_auth_code_123');

      // The user must stay on /connect — no redirect to dashboard
      await expect(connectPage.connectButton).toBeVisible();

      // Error toast must appear with the Persian error message for SUBSCRIPTION_ALREADY_BOUND
      await expect(
        authenticatedPage.getByText(
          'اشتراک فعال شما برای پیج دیگری استفاده شده است. برای این پیج یک پلن جدید بخرید.',
        ),
      ).toBeVisible();
    },
  );
});
