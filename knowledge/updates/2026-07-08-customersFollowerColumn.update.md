# Customers page: follower column between title and page ID — 2026-07-08

Admin front `/customers` page. Column defs:
`Front/apps/admin/src/app/(main)/customers/columns.tsx`.

## Problem

- The standard (non-pro) customers table showed the initial follower count
  (`submittedInstagramFollowersCount`, "فالوئر اولیه") but **not** the current
  follower count after the user connects their Instagram.
- The current follower count (`instagrams[0].followersCount`, "فالوور") only
  existed in **pro** mode. Admins want to see, at a glance in the standard list,
  how many followers the account has after connecting.

## Solution

- Added a **فالوور** (follower) column to the base column list, positioned
  **between the Instagram title (`instagramTitle`) and the page ID
  (`instagramId`)**, so it shows in both standard and pro modes.
  - Reuses the existing id `totalFollowers` (backend-sortable via
    `sort=totalFollowers`) and accessor `row.instagrams[0]?.followersCount ?? 0`.
  - Cell formats the count with `toLocaleString('en-US')` (thousand separators),
    matching the adjacent "فالوئر اولیه" column; `-` when there is no connected
    Instagram.
- Removed the now-duplicate `totalFollowers` entry from the **pro** column list
  (`proItems`) — the base column already renders in pro mode, so keeping the pro
  one would show two identical "فالوور" columns.

No backend change (uses the already-supported `totalFollowers` sort key and the
existing `followersCount` field). No new i18n keys (headers here are inline
Persian strings, matching the rest of this columns file).

## Changes

- `apps/admin/src/app/(main)/customers/columns.tsx`
  - Add the `totalFollowers` follower column in the base `cols` array, between
    `instagramTitle` and `instagramId`, with a formatted numeric cell.
  - Remove the duplicate `totalFollowers` column from `proItems`.

## Verification

- `tsc` on the admin app: no new errors on `columns.tsx`. The only error on the
  file is the pre-existing `referrer` accessor `TS2881` (`?? '' + ' ' + …`
  precedence), untouched by this change; `next build` uses `ignoreBuildErrors`.
