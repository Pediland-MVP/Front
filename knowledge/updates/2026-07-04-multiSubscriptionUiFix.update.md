# Multi-Subscription UI Fix + Settings Coverage Indicators (2026-07-04)

Fix for a live user report: "Frontend just shows one active subscription at the time" — plus the requested UI improvements to `settings/subscription` and `settings/instagram`.

## Problem

The backend moved to **per-page subscription binding** (see `Back/knowledge/updates/2026-06-29-perPageSubscriptionBinding.update.md` and `2026-07-03-untargetedPurchaseAutoBind.update.md`): a workspace can now have many simultaneously **ACTIVE** subscriptions — one per Instagram page (`Subscription.instagramId`), plus at most one workspace-wide CREDIT (free-trial) subscription (`instagramId = null`). `GET /subscriptions` already returned `instagramId` per item; the frontend never read it.

`subscriptionStore.tsx` and 7 components all did `subscriptions.find(s => s.status === 'active')`, silently picking one arbitrary active subscription:

- `settings/subscription` (`ChoosePlan.tsx`) rendered exactly one status card no matter how many pages were covered — a paid subscription for a second/third page was invisible.
- `totalRemainingDays` (used for dashboard progress rings) only counted one page's days.
- The intentional "hide upgrade nudges while still on free credit" business rule (see `2026-07-02-creditSubscriptionDisplayFixes.update.md`) was gated on that same arbitrary pick, so it could now fire incorrectly once a workspace had both a credit sub and paid page subs.
- `settings/instagram` (`InstagramAccounts.tsx`) only ever showed a *negative* "no coverage, buy a plan" alert per page — no positive "this page is covered" indicator existed.

## Solution

**New shared helpers — `apps/dashboard/src/utils/subscription.ts`** — single source of truth for what counts as active coverage: `getActiveCreditSubscription`, `getActiveNonCreditSubscriptions`, `getActivePageSubscriptions`, `getUnboundActiveSubscriptions`, `hasOnlyFreeCredit`, `getRemainingDays`.

- `types/subscriptions/subscriptions.ts`: exported the `Subscription` interface and added `instagramId: string | null`.
- `store/subscriptionStore.tsx`: `calculateDays()` now sums remaining days across **all** active paid subscriptions (bound or pooled) instead of picking one.
- Six components swapped their `subscriptions.find(ACTIVE)?.type !== 'credit'` gate for `!hasOnlyFreeCredit(subscriptions)` (verified to preserve today's exact behavior in the 0-active and 1-active cases): `DashboardHelpBanner`, `SubscriptionBoard`, `UserDropdownMenu`, `WorkspaceDrawer`, `SettingsOptions`, `UserDetailsCard` (2 spots).
- `ChoosePlan.tsx`: replaced the single status card with a credit card (if any) + a grid of new `PageSubscriptionCard` components (one per active page-bound subscription, labeled with the page's avatar/username) + a dashed "unassigned" card for the pooled-but-active edge case. Removed dead commented-out JSX while rewriting this section.
- `SubscriptionsDetails.tsx`: reserved-subscription cards now show which page they'll activate for (when bound).
- `InstagramAccounts.tsx`: each page card now renders the existing negative `PagePromotionAlert` **or** the new positive `PageCoverageBadge` (shows the covering plan + days remaining, or "using workspace free credit" when the page itself isn't individually bound).

## Changes

- New: `apps/dashboard/src/utils/subscription.ts`, `components/Settings/PageSubscriptionCard.tsx`, `components/Settings/PageCoverageBadge.tsx`
- Modified: `types/subscriptions/subscriptions.ts`, `store/subscriptionStore.tsx`, `components/Settings/ChoosePlan.tsx`, `components/Settings/SubscriptionsDetails.tsx`, `components/Settings/InstagramAccounts.tsx`, `components/Console/Dashboard/DashboardHelpBanner.tsx`, `components/Console/Dashboard/SubscriptionBoard.tsx`, `components/Console/UserDropdownMenu.tsx`, `components/Console/WorkspaceDrawer.tsx`, `components/Settings/SettingsOptions.tsx`, `components/Layout/UserDetailsCard.tsx`
- i18n: `Subscription.page_coverage_title` / `unassigned_active_subscription` / `covered_page`, `Settings.Accounts.page_covered_by_plan` / `page_days_left` / `page_covered_by_credit` (fa + en).

No backend changes — this is a pure frontend read of data the API already returned.

## Follow-up refinements (same day, post-review)

- `ChoosePlan.tsx`: added `mb-4` to the VPN-off `Alert` so it no longer sits flush against the plan-duration cards below it.
- `PageCoverageBadge.tsx`: the positive coverage line was one dense sentence (`"این پیج تحت پوشش پلن «X» است — Y روز باقی‌مانده"`). Redesigned as a compact row — a check icon, the plan name as the primary label (`page_covered_by_plan`, now plan-only), and the day count as a separate rounded pill (`page_days_left`) — instead of one long string.
- **Separate, real backend bug found and fixed while comparing avatars across the two pages**: see `Back/knowledge/updates/2026-07-04-instagramAccountAvatarFix.update.md` — `GET /instagram/accounts` never joined the `profilePicture` relation, so page avatars never rendered on `settings/instagram` (they worked on `settings/subscription` only because that page sources avatars from `GET /users/me`, which does join it). Fixed backend-side; no frontend change needed since the response field name (`profilePictureUrl`) was preserved.

## Verification

- `pnpm --filter front build` → green.
- `tsc --noEmit` and `eslint` on every touched/new file → no new errors (only pre-existing, unrelated warnings — repo-wide zod/Badge-prop typing noise and a few pre-existing unused-var warnings — confirmed present before this change).
