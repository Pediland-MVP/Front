# Subscription Cards Show the Follower Tier (2026-07-11)

Adds a "محدوده فالوئر" (follower range) row to the subscription cards on
`settings/subscription`. Backend side (the join that supplies the data):
`Back/knowledge/updates/2026-07-11-subscriptionPlanFollowerJoin.update.md`.

## Problem

A user with an active subscription (including a pooled/unassigned one) saw only its
duration and plan-duration name — **no follower limit**. The plan's follower tier
(`plan.minFollowers` / `maxFollowers`, e.g. "۱K تا ۲۵K فالور") was neither in the API
payload nor rendered.

## Solution

The backend now returns `subscription.planDuration.plan` (see the Back doc). Frontend:

- **Type** (`types/subscriptions/subscriptions.ts`): added `plan?: Plan` to `PlanDuration`
  and a `Plan` interface (`id`, `name`, `minFollowers`, `maxFollowers`).
- **New shared component** `components/Settings/PlanTierBadge.tsx`: renders the plan's
  `name` — the **same tier label the user bought** (e.g. "۱K تا ۲۵K فالور", or "هدیه رایگان"
  for the free tier) — as a violet gradient pill with a `UsersThreeIcon`. Showing `plan.name`
  (rather than a computed `{min}–{max}` range) matches what the user recognizes from the buy
  flow. Renders nothing when `plan` is absent (safe against older responses).
- **Rendered in** both subscription cards: `PageSubscriptionCard.tsx` (bound page subs) and
  the unassigned-subscription card in `ChoosePlan.tsx`, under the "نوع اشتراک" row.

> First iteration used a `PlanFollowerRange` component showing "محدوده فالوئر: {min} تا {max}
> فالوئر". Replaced (per user feedback) with the plan-tier pill above so it reads like the
> purchased plan; the three `follower_*` i18n keys were removed (the badge shows data, no i18n).

## Changes

- New: `components/Settings/PlanTierBadge.tsx`.
- Modified: `types/subscriptions/subscriptions.ts`, `components/Settings/PageSubscriptionCard.tsx`,
  `components/Settings/ChoosePlan.tsx`.
- No new i18n keys (the badge renders `plan.name`, which is data).

## Verification

- `tsc --noEmit` (dashboard): no errors in the changed/new files (the single ChoosePlan
  error at line 99 is the pre-existing repo-wide zod-version-mismatch on `zodResolver`).
- `eslint` on the three files → 0 errors.
- Visual mockup of bound / unassigned / unlimited cards confirmed the row and formatting.
- SQL against dev DB confirms the data path (active sub → 0–25,000; free-gift → unlimited).
