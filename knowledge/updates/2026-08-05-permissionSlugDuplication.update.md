# Permission slug duplication: automation:* vs contentCycle:* (2026-08-05)

Branch `fix/permission-slug-duplication` (worktree
`Front/worktrees/fix-permission-slug-duplication`), off `merged-admin`.

Paired with a Back worktree of the same branch name — see
`Back/knowledge/updates/2026-08-05-permissionSlugDuplication.update.md` for the full
root cause.

## Problem

User-reported: revoking `automation:create`/`automation:view` from a workspace member
didn't take away access — the automation "create" button still showed and worked.

## Root cause (Front side)

`usePermissions().can()` (`src/hooks/usePermissions.ts`) had the same
`automation:*` ↔ `contentCycle:*` OR-alias fallback as the backend's `PermissionEngine`
— a check for either slug passed if *either* twin was granted, but the two slugs were
granted/revoked independently. The permission-slug consolidation on the Back side
removes `contentCycle:*` entirely, so this alias becomes dead code (and, before this
fix, would have been actively wrong: it would still fall back to checking a slug that no
longer exists in the API response).

## Solution

- `usePermissions.ts`'s `can()` simplified to a plain `permissions.some((p) => p.slug === slug)` —
  no aliasing needed with a single slug family.
- Removed the now-orphaned `contentCycle` permission-translation blocks from
  `fa.json`/`en.json` (`Permissions._modules.contentCycle` and the 8-key
  `Permissions.contentCycle.{view,create,edit,delete}{,_desc}` block) — the slug family
  no longer exists on the backend, and the existing `Permissions.automation` block
  already carries the same labels, so `workspace/[memberId]/permissions/page.tsx` (which
  reads translations by module name returned from the API) needs no code change.

## Changes

- `apps/dashboard/src/hooks/usePermissions.ts` — `can()` alias fallback removed.
- `apps/dashboard/src/messages/fa.json` / `en.json` — orphaned `contentCycle` permission
  translation keys removed.

## Verification

- `src/app/(Console)/automations/page.test.tsx` (mocks `usePermissions`): passes via
  `vitest run`.
- `tsc --noEmit` on `apps/dashboard`: clean of permission-related errors (only
  pre-existing baselined errors remain — `Badge` children types, unresolved
  `next/image`/`next/link` inside `packages/ui`, etc.).
- Both `fa.json` and `en.json` validated as well-formed JSON after the edits.

## Not changed (flagged only)

- Data reconciliation for existing `member_permissions`/`permissions` rows is a Back-side
  DB concern — see the paired Back update doc. Local dev DB done via direct `psql`;
  back2/prod still pending.
