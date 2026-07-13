# Hide Subscription/Credit UI From Android WebView (2026-07-13)

Detects when the dashboard is loaded inside the wrapping Android app's WebView (via the `; wv)` marker Android's stock WebView appends to its User-Agent) and, only in that context, hides credit-type subscription info and every entry point into the `/settings/subscription` page.

## Problem

The Android app embeds the dashboard in a WebView. Product decision: subscription/billing management (including credit-based subscription details) should not be reachable or visible from inside the wrapped app — only from a real browser.

## Solution

- `Front/apps/dashboard/src/hooks/useIsWebView.ts` (new): client-only hook, tests `navigator.userAgent` against `/; ?wv\)/i` after mount (`useEffect`). Defaults to `true` (assume WebView/hidden) until the check runs, so gated UI fails closed instead of flashing visible for a frame.
- `Front/apps/dashboard/src/utils/subscription.ts`: added `hasActiveCreditSubscription(subs)` — true whenever any active credit-type sub exists, regardless of a coexisting paid sub (broader than the existing `hasOnlyFreeCredit`). Used only where the displayed content is actually credit-specific — never to gate a whole component, since a coexisting paid sub still has legitimate non-credit info to show.
- `components/Console/Dashboard/SubscriptionBoard.tsx` — the board's overall visibility is still governed by the existing `hasOnlyFreeCredit` (unchanged for non-WebView and WebView alike); a WebView-only `showCreditRadial` flag additionally forces the `ProgressRadial` to show paid days instead of the credit count when a credit sub happens to be `currentSubscription`, without hiding the rest of the board (Instagram list, paid days).
- `components/Layout/UserDetailsCard.tsx` — left unchanged: its `ProgressLine` already only reflects non-credit remaining days (`hasOnlyFreeCredit` gate, unaffected by WebView), so there was no credit-specific content to hide there.
- Navigation to `/settings/subscription` hidden entirely for WebView (regardless of credit/paid mix):
  - `components/Console/Dashboard/SubscriptionBoard.tsx` — "renewal_subsription" button.
  - `components/Settings/SettingsOptions.tsx` — "upgrade_plan" nav item.
  - `components/Console/UserDropdownMenu.tsx` — "upgradeAccount" item.
  - `components/Settings/PageCoverageBadge.tsx` — both "buy_additional_cta" buttons, and the credit-covered `Alert` note (credit-specific display).
- `app/(Console)/settings/subscription/page.tsx` — defensive page-level guard covering direct/deep-link navigation (no in-app button leads here anymore, but a WebView user could still type/bookmark the URL). Shows no message at all: while `isLoading` or the WebView check hasn't resolved yet (`hasCheckedWebView`), it renders the same loading spinner already used for the permission check; once `isWebView` is confirmed true, it silently `router.replace('/')`s to the dashboard instead of rendering any "not available" text — a real browser only ever sees the spinner then the normal permission check/content, never a false-positive block.

`DashboardHelpBanner.tsx` (a connect-Instagram help/video prompt, not a subscription display or nav link) was left unchanged as out of scope.

## Verification

- `npx tsc --noEmit` in `apps/dashboard`: only pre-existing baseline errors remain; none in the touched files.
- `npx eslint` on all touched files: 0 errors (only pre-existing unrelated warnings).
- Manual detection caveat: relies on Android's default WebView UA marker `; wv)`; breaks if the Android app ever overrides the UA string without preserving that token.
