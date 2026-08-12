# Workspace Drawer Redesign (2026-08-03)

Spec: `docs/superpowers/specs/2026-08-03-workspace-drawer-redesign-design.md`.
Paired Back worktree: `feat/workspace-drawer-redesign` (same branch name).

## Problem

The mobile navbar's profile icon opened `WorkspaceDrawer`, which only showed
a profile header and a flat workspace list (inline add-workspace form, a
per-workspace settings gear) — it never showed which Instagram accounts
belong to each workspace, nor their connection/subscription state. A new
prototype grouped Instagram accounts under their workspace with connection
status and subscription credit-days, plus a clearer profile-edit entry
point and an "add page" action.

## Solution

Split `WorkspaceDrawer.tsx` into a thin Drawer-chrome wrapper and a new
`WorkspaceDrawerContent.tsx` that owns all data/interaction logic (so it's
testable without vaul's portal mechanics). The new content: a close (X)
button, a profile card with a pencil `Link` to `/settings`, an
always-expanded (no collapse toggle) list of every workspace with its
Instagram accounts nested underneath — each showing a green/red connection
dot from the now-available `isIgTokenValid` field (paired Back change) and
the existing `PageCoverageBadge` component for subscription credit-days
(reused as-is, not rebuilt) — and a footer with an "افزودن پیج" button to
`/connect` plus the existing logout button. Tapping any workspace or
account row calls the existing `useWorkspaces().changeWorkspace` and closes
the drawer. The mobile bottom nav's "profile" icon/label
(`NavBottom.tsx`) changed to a `BuildingsIcon` + "کسب‌وکار" label.

Removed: the inline add-workspace form and the per-workspace settings-gear
button (not in the approved design) — this also removes a pre-existing bug
where the form's toast calls looked up `Console.Workspace.success/error`
(the real keys live under `Settings.Workspace.*`), since that code path is
gone.

## Changes

- `apps/dashboard/src/types/workspace.ts`: `Workspace.instagrams:
  WorkspaceInstagramAccount[]` (new interface) — types the nested data
  `GET /workspaces` already sent but the frontend never typed.
- `apps/dashboard/src/messages/{fa,en}/Console.json`: new
  `Console.WorkspaceDrawer` key block (`connectedPages`, `addPage`,
  `connected`, `disconnected`, `close`, `editProfile`).
- `apps/dashboard/src/messages/{fa,en}.json`: new `NavBottom.business` key.
- `apps/dashboard/src/components/Console/WorkspaceDrawerContent.tsx` (new)
  + `WorkspaceDrawerContent.test.tsx` (new, 11 tests).
- `apps/dashboard/src/components/Console/WorkspaceDrawer.tsx`: reduced to a
  thin `Drawer`/`DrawerContent` wrapper around `WorkspaceDrawerContent`.
- `apps/dashboard/src/components/Layout/NavBottom.tsx`: `UserCircleIcon` +
  `profile` label swapped for `BuildingsIcon` + `business` label on the
  drawer-opening nav item.

## Verification

`WorkspaceDrawerContent.test.tsx` — 11 tests (TDD red→green), covering:
profile name/mobile render, total connected-pages count, per-workspace
Instagram grouping, disconnected-label rendering, workspace/account-row tap
switching context + closing the drawer, no-op tap on the already-active
workspace, add-page navigation to `/connect`, pencil navigation to
`/settings`, the close button, and (added during final-review fixes)
`PageCoverageBadge` rendering only for the active workspace's account, not
for other workspaces'. `NavBottom.tsx`'s change is a pure icon/label swap
with no existing test file to update.

Two items were deferred during task review, both Minor: (1) the Instagram account row's `<button>` still nests `PageCoverageBadge`'s own internal button in some subscription states — a `stopPropagation` wrapper fixes the functional click-bubbling bug but not the underlying invalid-HTML nesting; a full fix would require changing the row from a `<button>` to a non-button clickable container. (2) No automated test exercises the `stopPropagation` fix itself (the `PageCoverageBadge` test mock stays an inert div).

**DEPLOY COUPLING:** this frontend reads the new `isIgTokenValid` field from
`GET /workspaces`; if this Front change ships before the paired Back change,
the field is `undefined` for every account and is treated as falsy, so every
Instagram account in the drawer shows the red "قطع شده" (disconnected) dot
even when it is actually fine. Deploy the paired Back change **before** (or
together with, never after) this Front change.

`PageCoverageBadge` is also now only rendered for the currently active
workspace's accounts (see the 2026-08-03 final-review fix) — it reads
`useSubscriptionStore()`, which only ever holds the active workspace's
subscriptions, so rendering it for other workspaces' accounts showed wrong
or falsely-shared subscription state.
