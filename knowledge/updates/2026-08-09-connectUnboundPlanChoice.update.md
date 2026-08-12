# Connect — Unbound Plan Choice (2026-08-09)

Related: `2026-08-08-secondInstagramSubscriptionGate.update.md`,
`2026-08-08-workspaceScopedSubscriptionSlot.update.md`,
`2026-08-08-settingsInstagramSubscriptionGate.update.md`.

## Problem

User-reported dead end. A workspace holding an **unbound (unassigned) paid
subscription** could not connect a new Instagram account whose follower count
did not fit that subscription's tier — and had no way to recover.

The cause is a tier-blind gate. `hasAvailableSubscriptionSlot`
(`Back/apps/core/src/workspaces/workspaces.service.ts:239`) is true whenever the
workspace holds *any* unbound Time subscription or live credit. It never
compares that subscription's follower range against the page being added — it
cannot, because the page is not connected yet. So `connect/page.tsx` skipped
`SetupInstagramDialog` and rendered only the plain Instagram OAuth link.

The follower-range check happens much later, server-side in
`SubscriptionBindingService.bindOnConnect` (step 3,
`subscriptionBinding.service.ts:131-149`), *after* the OAuth round-trip. On a
mismatch it throws `SUBSCRIPTION_NOT_COMPATIBLE_WITH_FOLLOWER_COUNT` and the
whole transaction rolls back, so the new `Instagram` row is discarded too.

`useConnectInstagram.ts:32-34` handles that rejection with a single
`toast.error(t_ec(code))` — no redirect, no state change, no clearing of the
`code` query param. Nothing on the page changed, and
`hasAvailableSubscriptionSlot` is still true, so the user saw the same lone
connect button and retried forever. The toast told them to buy a matching plan,
but the only surface that sells one (`SetupInstagramDialog`) was gated **off**
by the very subscription causing the failure.

Reachable from both entry points: `/settings/instagram`'s "Add account" button
links to `/connect` in exactly this state, so it funnelled users into the same
loop.

## Solution

Frontend only — no backend change. On `/connect`, when the workspace's coverage
is an **unbound paid plan**, stop assuming it fits and let the user decide:

- Show each unbound subscription (duration name + `PlanTierBadge` follower
  tier) so the user can judge the fit themselves.
- **ادامه با همین اشتراک** — the existing OAuth link, unchanged. Still one tap
  for the common case where the tier does fit.
- **خرید پلن دیگر** — opens the existing `SetupInstagramDialog` (username →
  follower lookup → matching plan → buy). This is the exit that did not exist.

Detection reuses `getUnboundActiveSubscriptions()` (`utils/subscription.ts`),
which **excludes credit subscriptions by design** — exactly right here, since
credit coverage is workspace-wide and follower-count-blind (`bindOnConnect`
step 2), so it can never mismatch and must keep going straight to OAuth.

No new data plumbing: `/connect` is already wrapped by `SiteProvider`
(`connect/layout.tsx`), which mounts `useSubscriptionData()` and populates the
shared `useSubscriptionStore` — the same store `ChoosePlan.tsx` reads.

Scoped to `/connect` only. `/settings/instagram` needs no change because its
button only ever forwards here in this state.

## Changes

- `apps/dashboard/src/app/(Connect)/connect/page.tsx`
  - New `showUnboundPlanChoice` branch, placed after `needsSubscriptionSetup`
    (the two are mutually exclusive — one requires a slot, the other its
    absence).
  - Reads `subscriptions` from `useSubscriptionStore()`; derives
    `unboundSubscriptions` via `getUnboundActiveSubscriptions`.
  - Extracted the Instagram OAuth URL to a module-level `IG_OAUTH_URL` const so
    the two buttons that start the handshake cannot drift apart.
- `apps/dashboard/src/messages/fa.json` / `en.json` — 4 new `Connect` keys:
  `unbound_choice_title`, `unbound_choice_description`,
  `continue_with_unbound_cta`, `buy_another_plan_cta`.
- `apps/dashboard/src/app/(Connect)/connect/page.test.tsx` — mocks
  `useSubscriptionStore`; adds a `ConnectPage — unbound plan choice` describe
  with 5 cases.

## Verification

`vitest run "src/app/(Connect)/connect/page.test.tsx"` — **10 passed** (5
pre-existing + 5 new):

- offers continue-or-buy instead of the lone connect link when an unbound paid
  plan exists
- names the unbound plan and its follower tier
- opens the setup dialog from "buy a different plan"
- keeps the plain connect link when the only coverage is credit
- ignores a plan already bound to a page

Not manually smoke-tested in a browser.

## Known gaps (not fixed here)

- `/settings/instagram`'s add-account button renders as a `/connect` link while
  `accountCount` is still `0` — it is only set by SWR's `onSuccess`
  (`InstagramAccounts.tsx:57`), so a fast click during the initial fetch
  navigates away even when the dialog was the right target.
- `SetupInstagramDialog` collapses every lookup failure (typo'd username,
  private account, Apify outage, `INSTAGRAM_LOOKUP_COOLDOWN`) into one manual
  fallback screen, buys the longest duration in one tap without showing a
  price, and has no way back to the username input.
