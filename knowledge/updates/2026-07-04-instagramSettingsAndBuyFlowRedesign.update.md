# Instagram Settings CTA/Styling + Subscription Buy-Flow Redesign (2026-07-04)

Follow-up to `2026-07-04-multiSubscriptionUiFix.update.md`, from further live feedback: `settings/instagram` never offered a "buy subscription" action once a page was already covered, the positive coverage text was flagged as bad and needed a near-expiry warning state, the Instagram cards felt cramped, and `settings/subscription` needed to stop showing "the first plan" to everyone and instead let the user pick which page they're buying for.

> Backend counterpart (reserved-for-page renewal queue + `GET /plans` fix): `Back/knowledge/updates/2026-07-04-reservedRenewalQueue.update.md`.

## Problem

- `InstagramAccounts.tsx` only ever rendered a "buy a plan" CTA (`PagePromotionAlert`) for **uncovered** pages; `PageCoverageBadge` (covered pages) had no CTA at all, and no page could show a warning as its coverage approached expiry.
- `PagePromotionAlert`/`PageCoverageBadge` rendered as direct children of a zero-padding `Card`, so their `mt-2`-only styling bled edge-to-edge instead of matching the header's `p-4` inset — the concrete bug behind "bad spacing."
- `ChoosePlan.tsx` ignored `IPlan.minFollowers`/`maxFollowers` entirely — it always took `plans[0]` (an arbitrary/whatever-came-first plan from an unfiltered list) and showed its duration cards to every user regardless of which page they meant to cover.

## Solution

**`PageCoverageBadge.tsx`** — added a persistent "خرید اشتراک" CTA (routes to `/settings/subscription?instagramId=`, same pattern as `PagePromotionAlert`) to both the covered-by-plan and covered-by-credit branches, with a hint line explaining it will queue and auto-activate once the current plan ends (documents the new backend reserved-queue behavior in-product). Added `isExpiringSoon = remainingDays < 7`: the coverage container, its icon, text, and day-count pill all flip from the green palette to a red/destructive one together.

**`InstagramAccounts.tsx`** — wrapped the promotion/coverage element in a `px-4 pb-3` div matching the header's horizontal padding, and bumped the grid gap from `gap-3` to `gap-4`.

**`ChoosePlan.tsx`** — removed the unconditional "take `plans[0]`" duration-card block. Replaced with a `خرید اشتراک` trigger button revealing a two-step flow (local component state):
- Step 1 (page picker, skipped if `instagramId` arrived via query prop): a grid of the workspace's connected pages (avatar + `@username` — follower count isn't available on `/users/me`'s Instagram shape, so it's not shown here; the actual follower-based filtering still happens server-side once a page is picked).
- Step 2: new hook `usePlansForPage(instagramId)` (`app/(Console)/settings/subscription/hooks/usePlansForPage.tsx`) calls `GET /plans?instagramId=&discountCode=` and renders the plan's duration cards (unit/monthly price math, buy button — reused verbatim from the old code, just re-scoped). Shows a queue notice if the selected page is already covered (ties into the backend's reserved-renewal-queue), or a "no matching plan" message if the page's follower count falls outside every tier.
- The page-coverage grid, unbound-pool cards, credit card, discount widgets, and the reserved-subscriptions link are unchanged.

No changes to `subscriptionStore.tsx` — its global `/plans?discountCode=` fetch stays (still needed by `DiscountAlert.tsx`'s referral-discount banner); only `ChoosePlan.tsx` stopped reading `plans[0]` from it.

## Changes

- Modified: `components/Settings/PageCoverageBadge.tsx`, `components/Settings/InstagramAccounts.tsx`, `components/Settings/ChoosePlan.tsx`
- New: `app/(Console)/settings/subscription/hooks/usePlansForPage.tsx`
- i18n: `Settings.Accounts.buy_additional_cta`/`buy_additional_hint`; `Subscription.choose_page_title`/`choose_page_description`/`no_pages_connected`/`connect_page_cta`/`renewal_will_queue_notice`/`no_plan_for_followers`/`back` (fa + en).

## Verification

- `pnpm --filter front build` → green.
- `tsc --noEmit` / `eslint` on every touched/new file → no new errors (only pre-existing, unrelated baseline noise — zod/Badge-prop typing, a couple of pre-existing unused-var warnings — confirmed present before this change).
