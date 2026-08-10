# Workspace Drawer: Remaining Days for Every Workspace (2026-08-05)

Follow-up to `2026-08-03-workspaceDrawerRedesign.update.md`.
Paired Back branch: `fix/workspace-drawer-remaining-days` (same branch name).

## Problem

Real-user testing of the shipped drawer redesign caught a gap: subscription
"days-left" only ever showed for the currently active workspace's Instagram
accounts. The prototype (and the original spec) expected it for every
workspace's accounts.

Root cause: the drawer reused `PageCoverageBadge`, gated to
`isActive && <PageCoverageBadge ... />` — a fix from the earlier final
review, correcting a worse bug (the badge was showing *wrong* subscription
data for non-active workspaces, since it reads from a Zustand store that's
only ever populated with the active workspace's subscriptions). That fix
traded a wrong-data bug for a no-data gap, which is what the user then hit.

## Solution

The paired Back branch now computes `subscriptionDaysLeft`/
`hasReservedSubscription` per instagram and `hasCreditCoverage` per
workspace directly in `GET /workspaces` (see that repo's update doc).
`WorkspaceDrawerContent.tsx` drops `PageCoverageBadge` entirely for this
view and renders the subscription text straight from those fields — this
also removes the deferred nested-button markup concern from the earlier
review, since there's no longer an interactive `PageCoverageBadge` button
nested inside the account row's own button.

Display priority, mirroring `PageCoverageBadge`'s original logic: an
ACTIVE subscription's days-left (plus any queued RESERVED days) → else
workspace credit coverage → else a RESERVED-only "pending activation" note
→ else nothing.

## Changes

- `apps/dashboard/src/types/workspace.ts`: `WorkspaceInstagramAccount`
  gained `subscriptionDaysLeft`/`hasReservedSubscription`; `Workspace`
  gained `hasCreditCoverage`.
- `apps/dashboard/src/messages/{fa,en}/Console.json`: new
  `Console.WorkspaceDrawer.{daysLeft,coveredByCredit,pendingActivation}`
  keys.
- `apps/dashboard/src/components/Console/WorkspaceDrawerContent.tsx`:
  removed the `PageCoverageBadge` import/usage and the `isActive` gate on
  it; renders the new backend-provided fields directly for every
  workspace.
- `apps/dashboard/src/components/Console/WorkspaceDrawerContent.test.tsx`:
  replaced the "only active workspace gets a badge" test with tests
  covering days-left (both active and non-active workspaces), credit
  coverage, pending-activation, and the no-subscription case.

## Verification

`WorkspaceDrawerContent.test.tsx`: 14 tests (was 11), TDD red→green. Full
`apps/dashboard` vitest suite re-run: 13 files / 60 tests passing, output
pristine.
