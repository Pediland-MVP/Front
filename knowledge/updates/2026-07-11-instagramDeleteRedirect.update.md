# Instagram Delete — Only Redirect to /connect When None Left (2026-07-11)

Fixes the delete flow on the `settings/instagram` page. Builds on
`2026-07-11-instagramReconnectBanner.update.md` (same component).

## Problem

Deleting one Instagram page from `/settings/instagram` **always** sent the user to
`/connect`, even when other connected pages remained in the workspace. The redirect
should only happen when the **last** page is removed (workspace has zero pages left).

Root cause: `InstagramAccounts.tsx` `handleDeleteConfirm` called
`router.push('/connect')` unconditionally after any successful `DELETE /instagram/{id}`,
with no check on the remaining account count.

## Solution

Gate the redirect on the remaining count:

- Before the request, compute `remainingCount` = current list minus the item being
  deleted (`instagramPages.data.filter(a => a.id !== itemToDelete).length`).
- After a successful delete:
  - `remainingCount === 0` → `router.push('/connect')` (unchanged behavior for the
    last page; also matches the `AuthProvider` guard which redirects when
    `!hasInstagram`).
  - `remainingCount > 0` → **stay on the page** and `await mutateLocal()` to revalidate
    the `/instagram/accounts` SWR list so the deleted card disappears in place.

The `me` and `instagram` global mutations are unchanged.

## Changes

- Modified: `apps/dashboard/src/components/Settings/InstagramAccounts.tsx`
  (`handleDeleteConfirm` — conditional redirect; now uses the previously-unused
  `mutateLocal` from the SWR hook).
- No i18n changes. No backend changes.

## Verification

- `tsc --noEmit` (dashboard) → no errors in the changed file.
- Logic: with N pages, deleting one leaves N-1; redirect fires only when N-1 === 0.
