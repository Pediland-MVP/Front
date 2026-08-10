# Settings Restructure — 2026-08-09

Design spec: `docs/superpowers/specs/2026-08-09-settings-restructure-design.md` (outer MVP repo).

## Problem

Settings navigation was duplicated: the main sidebar carried some destinations as
top-level entries (`/workspace`, `/settings/instagram`) while every `/settings/*`
page rendered a second card-list (`SettingsOptions`) of the same places. Workspace
management also mixed three concerns on one page (switching, workspace info,
invitation banners) in a Telegram-style profile card unlike the rest of the app.

## Solution

One navigation: the sidebar's Settings entry now holds five ordered, icon-labeled
sub-items. Workspace info moved to a new `/settings/workspace` page built from the
standard settings form chrome. `/workspace` and `/settings` became redirects, and
profile/password/sessions merged into one tabbed `/settings/profile`.

## Changes

- `NavMain.tsx` — sub-items accept an optional `icon` and `badge`. The badge
  rendering is new: previously only non-collapsible top-level items rendered one,
  so moving the pending-invitations dot onto a sub-item would have dropped it.
- `ConsoleSidebar.tsx` — dropped the top-level `workspace`/`accounts` entries;
  Settings sub-items are now business info, connected pages, subscription, team
  members, bank info (in that order).
- `settings/workspace/page.tsx` (new) — invitation/transfer banners, create
  workspace, rename form, category form, danger zone (ownership transfer + delete).
- `WorkspaceCategoryForm.tsx` (new) — `PATCH /workspaces/:id { categoryId }`. Note
  the workspace reads its category as a nested `category.id` but writes a flat
  `categoryId`.
- `workspace/page.tsx` — now redirects to `/settings/workspace`. The sibling
  `workspace/[memberId]/permissions` route is unchanged and still used by
  `TeamManager`.
- `settings/profile/page.tsx` — three tabs; `PasswordTab.tsx` and
  `AccountSessions/` extracted from the deleted `password/` and
  `account-session-management/` routes.
- `SettingsOptions.tsx` deleted; `settings/layout.tsx` simplified;
  `settings/page.tsx` redirects to `/settings/workspace`.
- i18n: new `Console.Sidebar` keys (`businessInfo`, `connectedPages`,
  `buySubscription`, `bankInfo`) in `messages/fa/Console.json`; new
  `Settings.Workspace` / `Settings.Profile` keys and a repurposed
  `transfer_ownership_button` in `messages/fa.json`.

## Backend

None. `PATCH /workspaces/:workspaceId` already accepted `categoryId` and
`GET /workspace-categories` already existed — this change only wires them up.

## Verification

- vitest: `NavMain`, `ConsoleSidebar`, `WorkspaceCategoryForm`,
  `settings/workspace`, `settings/profile` suites pass.
- Manual: sidebar order/icons, `/settings` and `/workspace` redirects,
  `/workspace/[memberId]/permissions` still reachable from the team page,
  category change persists (verified against the local dev DB).
