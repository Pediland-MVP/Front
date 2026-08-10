# Trigger subscription-setup dialog from Settings "Add account", not /connect (2026-08-08)

Related prior docs:
`knowledge/updates/2026-08-08-secondInstagramSubscriptionGate.update.md`,
`knowledge/updates/2026-08-08-workspaceScopedSubscriptionSlot.update.md`

## Problem

The subscription-setup gate (`SetupInstagramDialog`) only showed up after the user landed
on `/connect`. The normal path to add a 2nd Instagram account is the "Add account" button on
`/settings/instagram` — a plain `<Link href="/connect">` — so the user saw a page navigation
first and the gate dialog only after that, which reads as "it just goes straight to connect."
The user asked for the check and the dialog to happen right at the button click, in Settings,
not after arriving on `/connect`.

## Solution

`/settings/instagram`'s "Add account" button now runs the same `hasAvailableSubscriptionSlot`
check as `/connect` (sourced from `useWorkspaces()`, matched by `usePermissions().workspaceId`
— see the paired doc for why not `useUser()`). When the workspace already has an Instagram
account and no available subscription slot, the button opens `SetupInstagramDialog` in place
instead of navigating; otherwise it still links to `/connect` as before (covers both the
0-account case and the has-slot case).

`/connect`'s own gate is left as-is — it still protects direct/URL navigation to `/connect`
and the post-OAuth-callback path, so it isn't a single point of failure.

## Changes

- `apps/dashboard/src/app/(Console)/settings/instagram/page.tsx` — added `hasInstagram` (from
  `accountCount`) + `hasAvailableSubscriptionSlot` (from `useWorkspaces()`), and an
  `isSetupDialogOpen` state. The "Add account" button now branches three ways: disabled
  (at-limit / no permission), open `SetupInstagramDialog` (has instagram, no slot), or
  `Link` to `/connect` (has a slot or zero accounts yet).

## Verification

- Manual code read-through of the branch logic against the 3 states (0 accounts, ≥1 account
  with a slot, ≥1 account with no slot); no test file existed for this page prior to this
  change.
