# Second Instagram Subscription Gate (2026-08-08)

Spec: `docs/superpowers/specs/2026-08-08-second-instagram-subscription-gate-design.md`
(outer repo root, not inside `Front`).

## Problem

Connecting a **second (or later) Instagram account** to a workspace had no
guided UX to help the user buy a matching subscription first — the `/connect`
flow just sent them straight into the Instagram OAuth link regardless of
whether their workspace already had unused subscription coverage. The backend
side of this had the same gap: it did not even require a subscription before
letting a second account bind.

## Solution

- New `SetupInstagramDialog` component, shown on `/connect` when the
  workspace has **no available subscription slot** for another account. Flow:
  username check → Instagram follower-count lookup → either a matched plan
  (buy directly) or a manual fallback (pick any plan) → purchase.
- Gated by a new `hasAvailableSubscriptionSlot: boolean` flag added to
  `IUser.data` (from `GET /users/me`) — `connect/page.tsx` branches the
  connect button: with an available slot, the existing plain Instagram OAuth
  link renders unchanged; without one, the new dialog's CTA renders instead.
- After a **pooled** subscription purchase (paid but not yet bound to a
  specific Instagram account) completes, the payment-verify page now
  redirects to `/connect` instead of `/settings/instagram` — so the user
  lands back where they can finish connecting the account the subscription
  was meant for. A one-time-read cookie (`pending_ig_username`, cleared after
  first read) carries the username the user had already typed into the
  dialog, so `/connect` can show a reminder of which account to connect
  rather than making them retype it.
- Fix 1 of this same wave: the three `ERROR_CODES` translations this feature
  needed (`SECOND_INSTAGRAM_REQUIRES_SUBSCRIPTION`, and the backend-introduced
  `USERNAME_REQUIRED` / `INSTAGRAM_LOOKUP_COOLDOWN`) had been added to the
  monolithic `messages/fa.json`, which is silently shadowed by
  `messages/fa/ErrorCodes.json` in the i18n loader's shallow merge
  (`src/i18n/request.ts`) — see `messages/fa/ErrorCodes.json` for where they
  now actually live.

## Changes

- `apps/dashboard/src/components/Connect/SetupInstagramDialog.tsx` (new) —
  the dialog itself (username → follower lookup → matched/manual plan →
  buy).
- `apps/dashboard/src/components/Connect/SetupInstagramDialog.test.tsx`
  (new).
- `apps/dashboard/src/app/(Connect)/connect/page.tsx` — branches the connect
  CTA on `hasAvailableSubscriptionSlot`; renders the reminder text from the
  `pending_ig_username` cookie when present.
- `apps/dashboard/src/app/(Connect)/connect/page.test.tsx` (new).
- `apps/dashboard/src/app/(Connect)/connect/hooks/useAllVisiblePlans.ts` (new).
- `apps/dashboard/src/app/(Connect)/connect/hooks/useInstagramFollowersLookup.ts`
  (new).
- `apps/dashboard/src/app/(Connect)/connect/hooks/usePlansByFollowers.ts`
  (new).
- `apps/dashboard/src/app/(Console)/settings/subscription/verify/page.tsx` —
  redirects to `/connect` (not `/settings/instagram`) when the completed
  purchase is pooled.
- `apps/dashboard/src/app/(Console)/settings/subscription/verify/page.test.tsx`
  (new).
- `apps/dashboard/src/app/(Console)/settings/subscription/hooks/usePayPlan.tsx`
  — sets the `pending_ig_username` cookie before redirecting to payment.
- `apps/dashboard/src/utils/pendingInstagramConnect.ts` (new) — cookie
  read/write/clear helper (one-time read).
- `apps/dashboard/src/hooks/useUser.tsx`, `src/types/user.ts` —
  `hasAvailableSubscriptionSlot` on the user data shape.
- `apps/dashboard/src/types/instagram.ts`,
  `src/types/payments/subscriptionPaymentVerify.ts` — supporting type fields.
- `apps/dashboard/src/messages/fa.json` — original (now-shadowed) translation
  entry; left as-is, out of scope for the i18n fix.
- `apps/dashboard/src/messages/fa/ErrorCodes.json` — the three
  `ERROR_CODES` translations actually reachable by the app (i18n fix, this
  wave): `SECOND_INSTAGRAM_REQUIRES_SUBSCRIPTION`, `USERNAME_REQUIRED`,
  `INSTAGRAM_LOOKUP_COOLDOWN`.
- `apps/dashboard/src/i18n/messages.test.ts` (new) — regression guard
  asserting the three keys live in `fa/ErrorCodes.json`.
- `apps/dashboard/vitest.config.ts` — added a missing `@components` alias so
  `connect/page.test.tsx` can resolve `@components/Connect/HowToConnectDialog`
  under vitest.

## Verification

Per-task reports (exact commands/output) at
`.superpowers/sdd/2026-08-08-second-instagram-subscription-gate/task-{6,7,8}-report.md`
and this wave's `final-fix-front-report.md` in the same folder.

- `SetupInstagramDialog.test.tsx`: 4 tests passing (username check →
  follower lookup → matched-plan / manual-fallback paths).
- `connect/page.test.tsx`: 4 tests passing (available-slot passthrough,
  first-account passthrough, gated CTA, pending-username reminder banner).
- `settings/subscription/verify/page.test.tsx`: 2 tests passing (pooled →
  `/connect` redirect, not-pooled → `/settings/instagram?isAfterPurchasingPlan`
  redirect).
- `src/i18n/messages.test.ts`: 3 tests passing (new `ERROR_CODES` keys land
  in the file that actually wins the shallow merge).
- Full dashboard suite was run during task 8 (`npx vitest run`): 69 tests
  passed, with pre-existing unrelated failures in a handful of files (e.g.
  `src/app/(Console)/automations/page.test.tsx`) predating this branch — no
  new regressions introduced by this feature.
