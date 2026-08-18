# 2026-08-18 — "Remaining days" must be active + reserved, everywhere it's shown

Branch: `fix/subscription-remaining-days-sum` (worktree, off `main`), same branch name in `Back`.
See `Back/knowledge/updates/2026-08-18-subscriptionRemainingDaysSum.update.md` for the backend half
(most call sites; the backend now returns already-summed `remainingDays` fields).

## Problem

A user's "remaining days" of subscription should be the SUM of the active subscription's days left
plus every reserved (already-paid, queued) subscription's full planned duration. Two frontend spots
were showing only the active sub's days, dropping any reserved days entirely; two admin spots
computed the sum but had a filter bug that silently dropped every reserved row before it could
contribute.

## Root cause

A `RESERVED` sub always has `expire = null` (it hasn't started ticking yet) — its days live in
`planDuration.durationDays` instead. Code that filters on `s.expire` before summing drops every
reserved row.

## Fix

- `apps/dashboard/src/components/Settings/PageSubscriptionCard.tsx` — only used the active sub's
  `expire` for both the radial's numerator (`remainingDays`) and denominator (`totalDays`). Now adds
  the same page's reserved days to both (matches `PageCoverageBadge.tsx`'s existing pattern), so the
  radial still reads as "days left out of days owned" instead of exceeding 100%.
- `apps/admin/src/app/(main)/users/columns.tsx` and `apps/admin/src/app/(main)/users/[id]/page.tsx`
  — both filtered subs to `['active','reserved'].includes(status) && s.expire` before summing, which
  drops every reserved row (their `expire` is always null) before the reduce's own
  `status === 'reserved' → planDuration.durationDays` branch ever runs. Dropped the `&& s.expire`
  filter. Also widened the "باقی مانده" (remaining) row's visibility condition on the user detail
  page — it used to hide entirely when there was no ACTIVE sub, even with reserved subs queued;
  now it shows whenever there's an active OR reserved sub.

Not touched (out of scope — not a "days shown" display): `subscriptionExpireWarning.dialog.tsx`
(it hides the low-days warning entirely when a reserved sub exists, doesn't show a combined
number) and `apps/admin/.../subscriptions/columns.tsx` (a per-subscription-row table, not a
per-user/per-page total).

## Follow-up (same day): dashboard header showed the free-trial view for a reserved-only user

`SubscriptionBoard.tsx` (the dashboard header card) decided which radial to show — the "X of Y free
automations" free-trial radial, or the subscription days/credit radial — from
`hasActiveSubscription`, which only checked for an ACTIVE sub (`activeSubscription || expiredSubscription`
→ `status === ACTIVE`). A user whose only subscription is RESERVED (already paid, queued to
activate) has nothing ACTIVE yet, so they were incorrectly shown the free-trial automation-count
radial and the "promotion is active" banner, even though they are not a free-trial user.

Fix: added `reservedSubscription` lookup and replaced `hasActiveSubscription` with
`hasSubscription = !!activeSubscription || !!reservedSubscription`, used everywhere that decided
free-trial vs. subscription view (the radial's percentage/type, and the promotion banner).
`currentSubscription` (used only for `showCreditRadial` and the credit value) is unchanged — a
reserved-only user still falls through to the `'days'` radial branch, which already renders
`totalRemainingDays`/`totalPurchasedDays` correctly since the store's `calculateDays` already sums
active + reserved.

## Verification

- `apps/dashboard` (pnpm filter `front`) and `apps/admin` scoped `tsc --noEmit`: no new errors in
  any touched file (pre-existing unrelated Badge/`children` baseline errors and one unrelated
  form-resolver error elsewhere in the user detail page — none referencing the touched code).
- No test runner for these apps (per project convention) — verified by reading the store's
  existing `calculateDays`/`PageCoverageBadge.tsx` reserved-days pattern and mirroring it exactly.
