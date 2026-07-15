# Credit Subscription — Dashboard Display Fixes (2026-07-02)

Bugfixes found during a review of how the dashboard shows subscription info for **credit** (free 300-message tier) vs **time** subscriptions.

> Business rule (confirmed): the paid-plan board, "days remaining" row, and every "upgrade / buy plan" CTA are **intentionally hidden** while the user still has the free credit. These fixes do **not** touch that behavior — they only correct defects that leak through or crash *around* it.

## Problem

- **Mislabeled credit unit** — `components/Console/ProgressRadial.tsx` rendered the credit count with the `t('days')` string (e.g. "300 days" instead of "300 messages").
- **Orphaned progress bar** — `components/Layout/UserDetailsCard.tsx` hid the "remaining" row for credit users, but the `<ProgressLine type="days">` beneath it sat **outside** that guard, leaking a permanently-empty days bar for credit users.
- **NaN SVG on expired credit** — `components/Console/Dashboard/SubscriptionBoard.tsx` feeds `currentSubscription?.credit` into `ProgressRadial`; for an expired credit sub with a null `credit` this becomes `NaN`, corrupting the arc math.
- **Unguarded `planDuration`** — `components/Settings/SubscriptionsDetails.tsx` read `sub.planDuration.name` / `.price` with no null/type check; a reserved **credit** sub (null `planDuration`) would throw.

## Solution

- **ProgressRadial**: credit branch now uses `t('message')` (already present in the `Components.Progress` namespace, fa + en).
- **UserDetailsCard**: wrapped the trailing `<ProgressLine>` in the same `activeSubscription?.type !== 'credit'` guard as the remaining-row (consistent with the hide-for-credit rule).
- **SubscriptionBoard**: coalesced the credit value to `currentSubscription?.credit ?? 0` so `ProgressRadial` never receives `NaN`.
- **SubscriptionsDetails**: reserved-sub card now branches on `sub.type` — shows "300 پیام رایگان" for credit and hides the price row; time subs use `sub.planDuration?.name` / `formatNumber(sub.planDuration?.price)` (optional-chained).

## Changes

- `apps/dashboard/src/components/Console/ProgressRadial.tsx`
- `apps/dashboard/src/components/Layout/UserDetailsCard.tsx`
- `apps/dashboard/src/components/Console/Dashboard/SubscriptionBoard.tsx`
- `apps/dashboard/src/components/Settings/SubscriptionsDetails.tsx`

No new i18n keys were needed (`Components.Progress.message` already exists in `fa.json` + `en.json`).

## Verification

- `eslint` on the four touched files → **0 errors** (only pre-existing unused-var warnings on untouched lines).
- Behavior preserved: the credit-hide rule (board, remaining row, upgrade CTAs) is unchanged; only the leak/crash/label defects are fixed.
