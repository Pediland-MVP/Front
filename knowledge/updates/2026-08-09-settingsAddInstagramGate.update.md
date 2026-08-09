# Settings — Add-Account Gate (2026-08-09)

Closes the first two "Known gaps" left open by
`2026-08-09-setupDialogUnboundStep.update.md`. That doc explains *why* an
unbound paid plan has to stop at the dialog; this one makes
`/settings/instagram` obey the same rule and stops the two surfaces drifting.

## Problem

`SetupInstagramDialog` now owns the whole "set up a subscription for a new
account" journey, but only `/connect` asked the full question before opening
it. `/settings/instagram`'s **افزودن اکانت** button asked half of it:

```ts
const needsSubscriptionSetup = hasInstagram && !hasAvailableSubscriptionSlot;
```

An **unbound paid plan makes `hasAvailableSubscriptionSlot` true**, so this read
`false` and the button rendered a plain `<Link href="/connect">`. The user
landed on `/connect`, where that page's *own* `hasUnboundPlan` check fired and
showed the very dialog the button could have opened — one wasted page load in
the middle of a paid flow.

Second, `accountCount` started at `0` and was only ever set by SWR's
`onSuccess`. While the accounts list was still in flight the page therefore
believed the workspace had **no** accounts — the one state that skips every
check — so the button was a live `/connect` link during the whole initial
fetch. A fast click navigated straight past the gate. A failed fetch never
fired `onSuccess` at all, so the count stayed wrong indefinitely.

## Solution

One hook owns the rule, and both entry points ask it.

New `useAddInstagramGate(hasInstagram)` reads `usePermissions` +
`useWorkspaces` + `useSubscriptionStore` and returns the decision:

| field | meaning |
|---|---|
| `needsSubscriptionSetup` | no unused coverage at all — the dialog sells a fitting plan |
| `hasUnboundPlan` | a paid plan bought but never bound to a page — tier-blind, so the dialog must let the user choose |
| `requiresSetupDialog` | either of the above — stop at the dialog |
| `isLoading` | workspaces or subscriptions still in flight |

`hasInstagram` stays a parameter because the two callers source it differently
(`/connect` from `useUser`, settings from the accounts list). Detection is still
`getUnboundActiveSubscriptions()`, which excludes credit by design — credit
coverage is follower-count-blind and can never mismatch.

Resulting behaviour on `/settings/instagram`:

- **First account** → plain `/connect` link, exactly as before.
- **Second or later, no available slot** → opens the dialog (unchanged).
- **Second or later, unbound paid plan** → *now* opens the dialog on its
  continue-or-buy step, instead of bouncing through `/connect`.
- **Second or later, credit-only or already-bound plan** → plain `/connect`
  link.

`InstagramAccounts` now reports `number | null` (`null` = count unknown) from a
`useEffect` on the SWR loading flag rather than `onSuccess`, so a *failed* fetch
also resolves the parent's unknown state (to `0`) instead of leaving it pending.
The button is disabled while the count is `null` or the gate is loading, so it
can never act on the half-loaded "first account, nothing to check" answer.

`/connect` keeps its exact previous behaviour — it just reads the same hook
instead of computing the rule inline.

## Changes

- `apps/dashboard/src/hooks/useAddInstagramGate.ts` (new): the shared rule.
- `apps/dashboard/src/app/(Console)/settings/instagram/page.tsx`: uses the hook;
  `accountCount` is `number | null`; new `isAddBlocked` folds limit, permission,
  unknown count and gate-loading into the button's `disabled`/`asChild`.
  Dropped its own `useWorkspaces` import and `workspaceId` destructure.
- `apps/dashboard/src/components/Settings/InstagramAccounts.tsx`:
  `onCountChange` widened to `(count: number | null)`, driven by `useEffect` on
  `isInstagramPagesLoading` instead of SWR `onSuccess`.
- `apps/dashboard/src/app/(Connect)/connect/page.tsx`: inline rule replaced by
  the hook. Dropped the now-unused `useWorkspaces`, `useSubscriptionStore` and
  `getUnboundActiveSubscriptions` imports.
- `apps/dashboard/src/app/(Console)/settings/instagram/page.test.tsx` (new).

No new i18n keys — the dialog already owns all of its own text.

## Verification

`vitest run "settings/instagram/page.test.tsx" "connect/page.test.tsx"
"SetupInstagramDialog.test.tsx"` — **30 passed** (12 new + 8 + 10 pre-existing).

The 12 new cases cover: first account → `/connect`; second with no slot → dialog;
second with an unbound plan → dialog (the fix); credit-only and already-bound
plans → `/connect`; first account never gated even with an unbound plan sitting
unused; button disabled while the count / workspaces / subscriptions load; the
5-account limit and `instagram:manage` still disable it; no `instagram:view`
hides it entirely.

Mutation-checked: reverting `requiresSetupDialog` to `needsSubscriptionSetup`
alone fails exactly 2 of the 30 (the settings unbound-plan case and `/connect`'s
matching one) and nothing else, so the new tests do guard the actual fix.

Not smoke-tested in a browser.

## Known gaps (not fixed here)

- `SetupInstagramDialog` still collapses every lookup failure into one manual
  fallback screen, buys the longest duration in one tap without showing a price,
  and has no way back to the username input.
- After buying from the settings dialog, the pending-username cookie set by
  `setPendingInstagramUsername` is still only read by `/connect`, so the
  reminder does not surface if the payment callback returns the user elsewhere.
