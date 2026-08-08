# Team Members Settings Page (2026-08-08)

Backend reference: `Back/knowledge/updates/2026-08-08-teamMembersPagination.update.md`;
endpoint contract: `Back/knowledge/front-back-relations.md` → `GET /workspaces/:workspaceId/members`.
Design spec: `docs/superpowers/specs/2026-08-08-team-members-settings-page-design.md`.

## Problem

Team management was buried inside the unrelated `/workspace` page (mixed in with the
profile card), and its member list had no search or real pagination — it fetched every
member in a single unpaginated call.

## Solution

Moved team management into its own `/settings/team` page, reachable via a new sidebar
sub-item under Settings, and adapted `TeamManager.tsx`'s active-members list to the same
paginated + searchable pattern already used by `Orders/OrdersCardList.tsx`.

- **`components/Settings/TeamManager.tsx`** — gained a required `search: string` prop.
  The active-members list switched from one unpaginated `useSWR` call to a paginated
  `useSWRImmutable` call against `/workspaces/{id}/members?page=&limit=&search=`,
  following the exact `OrdersCardList.tsx` pattern: page/limit state, `useDebounce`, and
  the `ItemsPagination` component rendered below the list. Pending invitations, the invite
  dialog, remove-member, and the manage-permissions link are all unchanged.
- **`app/(Console)/settings/team/page.tsx`** (new) — mounts `<TeamManager search={effectiveSearch} />`
  inside a `LayoutCard`, with a header search box (`SearchInput`/`SearchToggleButton`
  registered via the shared header-features store), same pattern as `orders/page.tsx`.
  Gated on `usePermissions().can('team:view')`, with a loading-state spinner while
  permissions are still resolving — matching `settings/instagram/page.tsx`'s convention —
  so unauthorized users never get the header search UI registered, and authorized users
  don't see a flash-of-blank-page. Reuses the existing `Settings.Team.title` /
  `Settings.Team.description` i18n keys for the page header; no new keys needed there.
- **`components/Layout/ConsoleSidebar.tsx`** — the Settings sidebar entry gained two
  sub-items via the existing `items` array pattern already supported by `NavMain.tsx` (no
  changes to `NavMain.tsx` itself): "تنظیمات عمومی" (General Settings) → `/settings` (the
  existing hub — added specifically because once an item has `items`, its own button
  becomes a toggle rather than a `Link`, so this preserves one-click access to `/settings`),
  and "اعضای تیم" (Team Members) → `/settings/team`. Two new i18n keys — `settingsHub`,
  `teamMembers` — added to `messages/fa/Console.json` and `messages/en/Console.json`'s
  `Console.Sidebar` object.
- **`app/(Console)/workspace/page.tsx`** — the embedded `<TeamManager />` Card block was
  removed entirely (the profile card is now the only content), grid widened from
  `grid-cols-1 md:grid-cols-3` to just `grid-cols-1`.

## Changes

- `Front/apps/dashboard/src/components/Settings/TeamManager.tsx`
- `Front/apps/dashboard/src/app/(Console)/settings/team/page.tsx` (new)
- `Front/apps/dashboard/src/components/Layout/ConsoleSidebar.tsx`
- `Front/apps/dashboard/src/app/(Console)/workspace/page.tsx`
- `Front/apps/dashboard/src/messages/fa/Console.json`, `Front/apps/dashboard/src/messages/en/Console.json`

## Verification

`npx tsc --noEmit` clean on all 4 touched files (`TeamManager.tsx`, `settings/team/page.tsx`,
`ConsoleSidebar.tsx`, `workspace/page.tsx`); no existing tests to update (none existed for
any touched component).
