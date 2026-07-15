# Multi-Target Labeling — Frontend (2026-06-28)

Full design: `docs/superpowers/specs/2026-06-27-labeling-instagram-workspace-design.md` (outer repo).
Backend: `docs/superpowers/plans/2026-06-27-labeling-instagram-workspace-backend.md`.
This plan: `docs/superpowers/plans/2026-06-28-labeling-instagram-workspace-frontend.md`.

## Problem

The admin labeling UI labeled **users only**. The backend now supports labeling
**user / workspace / instagram** with one rule applied at each chosen grain, a
per-field target-compatibility matrix, per-target preview, a workspace label
filter, and a new `GET /instagrams` list. The frontend had to catch up (the
backend intentionally breaks the old FE — `targetTypes` is now required, preview
returns `{ counts }`).

## Solution

- A pure compatibility engine (`app/(main)/labels/labelTargets.ts`): `collectFields`,
  `targetsForFields` (intersection of each used field's targets), `reconcileTargets`
  (auto-untick unsupported targets).
- Label form (`label-form-dialog.tsx`): target selector (user/workspace/instagram +
  "all"); a ticked target auto-unticks when the field set stops supporting it; a
  target checkbox is disabled when unsupported; submit blocked when no target ticked;
  preview shows per-target counts; payload sends `targetTypes`.
- Rule builder (`rule-builder.tsx`): each field option shows a `(ک،و،ا)` target badge.
- Labels table: a target-types column; matched-count column relabeled (now a sum).
- Workspaces list: label chips column + label filter (`labelId` query).
- New Instagram list page (`app/(main)/instagrams/*`): search, connection
  (`isIgTokenValid`), label, and admin (super-admin-only) filters; KAM is scoped by
  the backend and the admin filter is hidden for KAM.

## Changes

- `app/(main)/labels/{types.ts,labelTargets.ts,rule-builder.tsx,label-form-dialog.tsx,labels-table.tsx}`
- `app/(main)/workspaces/{columns.tsx,workspace-table.tsx,client-page.tsx}`
- `app/(main)/instagrams/{page.tsx,client-page.tsx,instagrams-table.tsx,columns.tsx}` (new)
- `types/{label.ts,workspace.ts,instagram.ts}`, `components/app-sidebar.tsx`
- `messages/fa.json` (target labels, badges, per-target preview, Instagrams namespace,
  sidebar key, `ERROR_CODES.LABEL_TARGET_FIELD_MISMATCH`)

## Verification

- `pnpm --filter admin exec tsc --noEmit` (changed files add no new errors),
  `pnpm --filter admin lint`, `pnpm --filter admin build`.
- Manual smoke: create a label, pick subscription field → instagram tick disables and
  unticks; per-target preview counts render; workspace + instagram lists filter by
  label and show chips; IG admin filter hidden for KAM.
