# Commerce Product-Core: Close Permission-Gate Gaps (Final Review Fix) — 2026-07-23

Full design/plan reference:
- `Front/docs/superpowers/specs/2026-07-22-commerce-product-management-design.md`
- `Front/docs/superpowers/plans/2026-07-22-commerce-product-management.md`
- Follows up on every prior `2026-07-2[2-3]-commerce*.update.md` doc for this feature.

## Problem

A whole-branch final review flagged one Important finding: across the new commerce
product-management UI, only `ProductListPage` (its card edit/delete buttons) and the product
editor's main Save button were permission-gated via `usePermissions().can(...)`. Several
other real mutations fired with **no** permission check anywhere in the frontend chain:

- `MediaSection.tsx` — media upload / delete / reorder.
- `VariantMediaPickerDialog.tsx` — `handleSave` (variant media PUT).
- `AdjustStockDialog.tsx` — `handleSubmit` (stock PATCH).
- `CollectionsSection.tsx` — `handleToggle` (collection membership PUT).
- `CategoryTree.tsx` / `CategoryDialog.tsx` / `CollectionsList.tsx` / `CollectionDialog.tsx`
  — every create/update/delete/reorder action.
- `ImportWizard.tsx` — the upload/start-import action.

The real backend routes already enforce `PERMISSION_GUARD` + the correct `product:*`
permission, so this was low-exposure (a non-permitted user hitting one of these via direct
action would get a backend 403 → error toast, never real data access) — but it broke this
branch's own established convention (`ProductListPage` already gates correctly) and left no
defense-in-depth on the frontend.

## Solution

Added `const { can } = usePermissions();` to every listed file, following the exact
`ProductListPage.tsx` convention: gate the mutating handler so the API call never fires
without the permission, and disable/hide the triggering control the same way.

**Verified against the real backend controllers** (rather than assuming) before picking a
slug per route:

- `Back/apps/core/src/commerce/media/media.controller.ts`,
  `Back/apps/core/src/commerce/inventory/stock.controller.ts` — upload/delete/reorder media,
  set variant media, and set stock all require `PRODUCT_EDIT`.
- `Back/apps/core/src/commerce/catalog/categories.controller.ts`,
  `collections.controller.ts` — create, update, AND delete for both categories and
  collections **all** require `PRODUCT_EDIT` — there is no separate create/delete slug for
  either resource (confirmed by reading the controllers directly; a plausible-sounding
  create→`product:create`/delete→`product:delete` split would have been wrong).
- `Back/apps/core/src/commerce/import/import.controller.ts` — `POST /commerce/import`
  requires `PRODUCT_CREATE` (it creates brand-new products).

### Per-file changes

- **`MediaSection.tsx`**: gated on `product:edit`. `handleFilesSelected`/`handleDelete`/
  `handleDragEnd` all no-op without it. The uploader control is hidden, and each tile's
  delete button + drag handle (`useSortable({ disabled: !canEdit })`) are hidden/disabled.
- **`VariantMediaPickerDialog.tsx`**: gated on `product:edit`. `handleSave` no-ops without
  it; the Save button is disabled.
- **`VariantsSection.tsx`**: the per-variant media button that OPENS the dialog above now
  also disables (`isMediaButtonDisabled = !variantId || !canEditMedia`) without
  `product:edit`, extending the exact same disabled+tooltip pattern already used for an
  unsaved variant (new tooltip key `mediaNoPermissionTooltip`) — not a new UI pattern.
- **`AdjustStockDialog.tsx`**: gated on `product:edit`. `handleSubmit` no-ops without it; the
  submit button is disabled.
- **`InventorySection.tsx`**: the "adjust stock" button (not "view ledger" — that only reads,
  gated `product:view` server-side) now also disables without `product:edit`, reusing the
  existing disabled+tooltip mechanism (new key `noPermissionTooltip`).
- **`CollectionsSection.tsx`**: `handleToggle` gated on `product:edit`; every collection chip
  is also disabled without it.
- **`CategoryTree.tsx`**: `handleDragEnd` (reorder) and `handleDeleteConfirm` gated on
  `product:edit`; the edit/delete buttons per node are hidden, and the drag handle is
  disabled via `useSortable({ disabled: !canEdit })`.
- **`CategoryDialog.tsx`**: `handleSubmit` (both create and update share one handler) gated
  on `product:edit`; submit button disabled.
- **`CollectionsList.tsx`**: `handleDeleteConfirm` gated on `product:edit`; edit/delete
  buttons per row hidden.
- **`CollectionDialog.tsx`**: `handleSubmit` (create + update) gated on `product:edit`;
  submit button disabled.
- **`products/taxonomy/page.tsx`**: the header "new category"/"new collection" buttons that
  open the two dialogs above are now hidden without `product:edit` too — otherwise a
  permission-less viewer could still open a dialog whose Submit silently does nothing, a
  confusing dead end. (Not explicitly named in the review finding, but a direct entry point
  to files that were; no dedicated test added, matching the pre-existing convention that
  `app/**/page.tsx` wrappers in this app have no test file of their own — their logic lives
  in the tested inner component.)
- **`ImportWizard.tsx`**: `handleFileSelected` gated on `product:create` (not `product:edit`
  — this creates new products); the uploader control is hidden without it.

## Changes

- Modified (permission gate + disable/hide UI):
  `apps/dashboard/src/components/Commerce/ProductEditor/sections/MediaSection.tsx`,
  `apps/dashboard/src/components/Commerce/ProductEditor/VariantMediaPickerDialog.tsx`,
  `apps/dashboard/src/components/Commerce/ProductEditor/sections/VariantsSection.tsx`,
  `apps/dashboard/src/components/Commerce/ProductEditor/AdjustStockDialog.tsx`,
  `apps/dashboard/src/components/Commerce/ProductEditor/sections/InventorySection.tsx`,
  `apps/dashboard/src/components/Commerce/ProductEditor/sections/CollectionsSection.tsx`,
  `apps/dashboard/src/components/Commerce/Taxonomy/CategoryTree.tsx`,
  `apps/dashboard/src/components/Commerce/Taxonomy/CategoryDialog.tsx`,
  `apps/dashboard/src/components/Commerce/Taxonomy/CollectionsList.tsx`,
  `apps/dashboard/src/components/Commerce/Taxonomy/CollectionDialog.tsx`,
  `apps/dashboard/src/components/Commerce/Import/ImportWizard.tsx`,
  `apps/dashboard/src/app/(Console)/products/taxonomy/page.tsx`.
- Modified (mocked `usePermissions` + added permission-gating test): the `.test.tsx` file
  for every one of the above except `page.tsx` (see note above).
- New test files (none existed before):
  `apps/dashboard/src/components/Commerce/Taxonomy/CategoryDialog.test.tsx`,
  `apps/dashboard/src/components/Commerce/Taxonomy/CollectionDialog.test.tsx`,
  `apps/dashboard/src/components/Commerce/Taxonomy/CollectionsList.test.tsx`.
- `apps/dashboard/src/messages/fa.json`: added `Commerce.Editor.Variants.
  mediaNoPermissionTooltip` and `Commerce.Editor.Inventory.noPermissionTooltip`.

## Verification

`cd apps/dashboard && npx vitest run src/components/Commerce`:

```
Test Files  18 passed (18)
     Tests  120 passed (120)
```

Every pre-existing test still passes (mocking `usePermissions` to default `can() => true`
kept existing assertions valid), plus one or more new tests per touched file proving the
mutating call does not fire — and the triggering control disables/hides — without the
required permission.
