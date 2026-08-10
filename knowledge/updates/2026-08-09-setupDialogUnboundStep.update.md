# Setup Dialog — Unbound Plan Step (2026-08-09)

Supersedes the UI placement in `2026-08-09-connectUnboundPlanChoice.update.md`
(same problem, wrong surface). The diagnosis in that doc still stands; only
where the choice is rendered changed.

## Problem

Two parts.

**The dead end itself** (unchanged from the earlier doc): a workspace holding
an **unbound paid subscription** could not connect a new Instagram account
whose follower count fell outside that subscription's tier.
`hasAvailableSubscriptionSlot` (`workspaces.service.ts:239`) is tier-blind — it
only asks whether *some* unused coverage exists, never whether it fits the page
being added, which it cannot know before the page is connected. The real check
runs server-side in `bindOnConnect` step 3 *after* the OAuth round-trip, throws
`SUBSCRIPTION_NOT_COMPATIBLE_WITH_FOLLOWER_COUNT`, and rolls the whole
transaction back. `useConnectInstagram.ts:32-34` only toasts it, so the page
never changed and the user retried forever — with no way to buy the plan the
toast asked for.

**The wrong fix**: the first attempt put the continue-or-buy choice *inline on
`/connect`*. That split the "set up a subscription for a new account" journey
across two different surfaces — page and dialog — for no reason. The dialog
already owns that journey end to end, so the decision belongs inside it.

## Solution

`SetupInstagramDialog` gains a new **first step**, shown only when the
workspace holds an unbound paid plan:

- An amber warning explaining that the plan activates only on an account inside
  its follower range, and that a page outside it will fail to connect.
- Each unbound plan listed with its duration name and `PlanTierBadge` tier.
- **ادامه با همین اشتراک** — links straight to the Instagram OAuth handshake.
- **خرید پلن دیگر** — sets `dismissedUnboundStep`, dropping the user into the
  dialog's existing username → follower-lookup → matching-plan flow, unchanged.

With no unbound paid plan the dialog opens on the username input exactly as
before — every other flow is untouched.

`/connect` no longer renders any of this itself. Its only change is the
condition for opening the dialog, which now also fires when an unbound paid
plan exists (`needsSubscriptionSetup || hasUnboundPlan`), since the dialog was
previously unreachable in precisely that state.

Detection uses `getUnboundActiveSubscriptions()`, which **excludes credit by
design** — credit coverage is workspace-wide and follower-count-blind
(`bindOnConnect` step 2), so it can never mismatch and needs no decision.

## Changes

- `apps/dashboard/src/components/Connect/SetupInstagramDialog.tsx`
  - Reads `subscriptions` from `useSubscriptionStore()` (already used it for
    `setActive`); derives `unboundSubscriptions` and `showUnboundStep`.
  - New `dismissedUnboundStep` state, cleared by the existing `reset()` so
    reopening always starts at the warning again.
  - New branch at the head of the body's ternary chain.
- `apps/dashboard/src/utils/instagramOAuthUrl.ts` (new): the OAuth URL, shared
  so `/connect` and the dialog cannot drift on scope or `redirect_uri`.
- `apps/dashboard/src/app/(Connect)/connect/page.tsx`: inline block removed;
  opens the dialog instead. Uses the shared `IG_OAUTH_URL`. Dropped the local
  `API_URL`/`INSTAGRAM_CLIENT_ID` consts left unused by the change.
- `apps/dashboard/src/messages/{fa,en}.json`: the four keys moved from
  `Connect` to `SetupInstagramDialog` (`unbound_warning_title`,
  `unbound_warning_description`, `continue_with_unbound`, `buy_another_plan`).
- Tests: `SetupInstagramDialog.test.tsx` gains a 6-case describe (its
  subscription-store mock is now per-test); `connect/page.test.tsx` rewritten
  to assert routing into the dialog rather than inline UI.

## Verification

`vitest run SetupInstagramDialog.test.tsx "connect/page.test.tsx"` —
**18 passed** (10 dialog + 8 connect page):

- warns about the unassigned plan before asking for a username
- names the plan and its follower tier
- offers the OAuth link to continue with the plan already owned
- falls through to the username flow after choosing to buy a different plan
- skips the step for credit coverage
- skips the step for a plan already bound to a page
- `/connect` routes an unbound paid plan into the dialog, keeps the plain
  connect link for credit-only and for already-bound plans

Not smoke-tested in a browser.

## Known gaps (not fixed here)

- `/settings/instagram`'s add-account button still links to `/connect` in this
  state, so reaching the warning costs one extra click there.
- Its button also renders as a `/connect` link while `accountCount` is still
  `0` (set only by SWR's `onSuccess`, `InstagramAccounts.tsx:57`), so a fast
  click during the initial fetch navigates away regardless.
- `SetupInstagramDialog` still collapses every lookup failure into one manual
  fallback screen, buys the longest duration in one tap without showing a
  price, and has no way back to the username input.
