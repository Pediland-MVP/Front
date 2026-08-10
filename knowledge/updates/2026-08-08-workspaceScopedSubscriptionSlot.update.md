# Move hasAvailableSubscriptionSlot to GET /workspaces (2026-08-08)

Related prior doc:
`knowledge/updates/2026-08-08-secondInstagramSubscriptionGate.update.md` (introduced
`hasAvailableSubscriptionSlot` on `GET /users/me` — this doc supersedes that field's source).

## Problem

User-reported: with exactly 1 Instagram connected and 0 subscriptions, clicking "add
Instagram" went straight to the OAuth flow instead of showing the subscription setup dialog.

Root cause (see the paired Back doc for the full backend trace): `GET /users/me` resolves
"current workspace" from the JWT access token's `workspaceId` claim, which is set once at
login/workspace-switch and never re-validated per request — it can go stale, especially in
local dev where the access-token TTL is ~100h and normal token refresh just re-mints the same
claim. `GET /workspaces` doesn't have this problem — it's keyed purely by the caller's real
active workspace memberships, and it already exposes an analogous field (`hasCreditCoverage`)
computed the same safe way.

## Solution

Read `hasAvailableSubscriptionSlot` from `useWorkspaces()`'s list (matched against the current
workspace id) on the connect page, instead of from `useUser()`. The backend now computes this
field on `GET /workspaces` instead of `GET /users/me` (see the paired Back doc).

Note: "which workspace is current" is still resolved via `usePermissions().workspaceId` —
itself sourced from the same JWT claim. This fix removes the staleness from the *data*, not
from *workspace selection* itself, which is a wider, pre-existing app-wide pattern and out of
scope here.

## Changes

- `apps/dashboard/src/app/(Connect)/connect/page.tsx` — reads
  `hasAvailableSubscriptionSlot` from the `currentWorkspace` entry in `useWorkspaces()`
  (already computed in this file for the "Workspace: <name>" display) instead of destructuring
  it from `useUser()`. Missing/not-yet-loaded workspace defaults to "no slot" (shows the setup
  dialog) rather than risking a false negative.
- `apps/dashboard/src/app/(Connect)/connect/page.test.tsx` — updated mocks to source the flag
  from `useWorkspaces()`; added a case for the missing-workspace default.
- `apps/dashboard/src/hooks/useUser.tsx`, `src/types/user.ts` — removed
  `hasAvailableSubscriptionSlot` (no longer part of the user data shape).
- `apps/dashboard/src/types/workspace.ts` — `Workspace` gains
  `hasAvailableSubscriptionSlot: boolean`.

## Verification

- `npx vitest run "src/app/(Connect)/connect/page.test.tsx"` — 5/5 pass.
- `npx vitest run` (full dashboard suite) — 91/91 pass, no regressions.
