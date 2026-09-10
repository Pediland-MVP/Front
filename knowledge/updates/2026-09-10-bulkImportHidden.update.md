# 2026-09-10 — Bulk product import hidden (وارد کردن گروهی)

Reference docs: `knowledge/updates/2026-07-23-commerceMediaInventoryImportNav.update.md` (the nav
entry + wizard as originally shipped), `Back/knowledge/updates/2026-09-10-commerceBulkImportHidden.update.md`
(the backend half).

## Problem

"وارد کردن گروهی" (bulk CSV/xlsx product import) should not be reachable for now. Users must not
see the link and must not be able to open the page by typing the URL — but the code is **not**
being deleted, we expect to turn it back on.

## Solution

Unwire, don't delete.

- `ConsoleSidebar.tsx` — the `/products/import` item under "محصولات" is commented out, so the only
  link to the page is gone. `productsImport` stays in `messages/fa/Console.json` and
  `messages/en/Console.json` untouched.
- `app/(Console)/products/import/page.tsx` — the page is now a server component whose whole body is
  `return notFound()`, so the route answers a real 404 through Next's not-found boundary. The
  original render (`LayoutPage` + `ImportWizard`) is kept as a comment right above it.

`ImportWizard.tsx`, `useImportJobPolling.ts` and both of their test files are untouched and still
build and pass — nothing imports them any more, that is all.

The backend routes they call (`POST /commerce/import`, `GET /commerce/import/:jobId`) 404 too, from
the same change on the Back side, so there is no path left even for a hand-made request.

## Changes

- `apps/dashboard/src/components/Layout/ConsoleSidebar.tsx` — `productsImport` nav entry commented
  out with a restore note.
- `apps/dashboard/src/app/(Console)/products/import/page.tsx` — `notFound()`; old body kept as a
  comment.

Not changed on purpose: the `import` case in `HeaderBreadcrumb.tsx` (`knownSegmentKey`) and the
`productsImport` translation keys — both are dead while the route 404s, and both are needed again
the moment it comes back.

## To bring it back

1. Un-comment the sidebar entry in `ConsoleSidebar.tsx`.
2. Restore the commented render in `products/import/page.tsx` (drop the `notFound()` export).
3. Re-register `ImportController` in Back's `commerce.module.ts` and un-skip its e2e block.

## Verification

- `npx tsc --noEmit` in `apps/dashboard` — 208 errors, all pre-existing (`packages/ui` and other
  untouched app files); **zero** in either touched file.
- `grep -rn "/products/import" apps/dashboard/src` returns only the commented-out sidebar line, so
  no live link is left anywhere in the dashboard or admin apps.
