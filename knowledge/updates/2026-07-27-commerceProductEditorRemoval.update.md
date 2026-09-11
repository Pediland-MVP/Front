# 2026-07-27 — Product add/edit page removed (Front only)

Branch: `feat/commerce-product-core` (Front worktree `worktrees/commerce-product-core`).

Full reference for what was removed: the docs that describe the editor as it existed are
kept as-is for history — `2026-07-22-commerceProductManagementFoundation.update.md`,
`2026-07-22-commerceVariantsPricing.update.md`,
`2026-07-23-commerceVariantMediaPicker.update.md`,
`2026-07-25-commerceCreateTimeMediaAndCollections.update.md`,
`2026-07-25-commerceEditorRedesign.update.md`,
`2026-07-27-commerceEditorVisualRefactor.update.md`. Read them together with this doc:
they describe code that no longer exists on this branch.

## Problem

The commerce product **add/edit page** had to be taken out of the frontend. This is a
**frontend-only** removal — the Back's `/commerce/*` catalog API is untouched, so every
endpoint the editor used still exists and still works.

## Solution

Delete the whole editor: both routes, the entire `ProductEditor` component tree, the one
util that only it used, and its i18n block. Then close the two entry points on the product
list that pointed at the now-deleted routes, so nothing in the app can navigate to a dead
page.

The list, taxonomy and import screens stay. They never imported anything from
`ProductEditor` (verified by grep before deleting), so the split was clean.

## Changes

### Deleted — routes

- `apps/dashboard/src/app/(Console)/products/add/page.tsx`
- `apps/dashboard/src/app/(Console)/products/[id]/page.tsx`
- `apps/dashboard/src/app/(Console)/products/[id]/product.tsx`

`products/layout.tsx`, `products/page.tsx`, `products/taxonomy/page.tsx` and
`products/import/page.tsx` are kept.

### Deleted — components

All 44 files under `apps/dashboard/src/components/Commerce/ProductEditor/`:

- Shell: `ProductEditorPage.tsx`, `productForm.schema.ts`
- Sections: `TitleSection`, `BasePricingSection`, `DescriptionSection`, `CategorySection`,
  `CollectionsSection`, `MediaSection`, `OptionsSection`, `VariantsSection`,
  `InventorySection`, `ShippingSection`, `SpecsSection`, `TagsSection`
- Dialogs: `CategoryPickerDialog`, `VariantMediaPickerDialog`, `AdjustStockDialog`
- Chrome: `ui/editorChrome.ts`, `ui/EditorSection.tsx`, `ui/EditorTopBar.tsx`,
  `ui/MediaDropzone.tsx`
- Utils: `variantMatrix`, `variantTree`, `variantBulk`, `variantIdentity`, `baseSeed`,
  `reconstructLedgerBalances`, `markdownPreview`, `MarkdownDescriptionField`
- Their tests

### Deleted — orphaned util

- `apps/dashboard/src/utils/commerce/toggleProductInCollection.ts` (+ its test) — only
  `CollectionsSection.tsx` ever imported it.
- `utils/commerce/buildCategoryTree.ts` is **kept**: the Taxonomy screen still uses it.

### Deleted — i18n (`apps/dashboard/src/messages/fa.json`)

- The whole `Commerce.Editor` namespace (351 lines).
- `Commerce.List.add` and `Commerce.List.Card.edit`, now that the two entry points are gone.
- `Commerce.List`, `Commerce.Taxonomy` and `Commerce.Import` are kept, and so is every
  commerce `ERROR_CODES` entry — the list/taxonomy/import screens still raise those codes.
- Only `fa.json` carried these keys; `en.json` never had a `Commerce` block.

### Changed — product list is now read-only apart from delete

- `ProductList/ProductListPage.tsx` — dropped the `product:create`-gated "کالای جدید"
  header button that pushed to `/products/add`. `HeaderButton` is now just the search
  toggle, so `useRouter`, `CircleFadingPlusIcon` and the `canEdit` probe are gone too.
- `ProductList/CommerceProductCard.tsx` — dropped the edit button that pushed to
  `/products/{id}`, its `canEdit` prop, `useRouter` and `PencilIcon`. The footer now renders
  only when `canDelete`, and the delete button takes the full width with a plain
  `rounded-b-xl` (the old conditional `rounded-bl-xl`/`rounded-br-xl` split only existed to
  pair the two buttons).

### Changed — tests

`ProductList/ProductListPage.test.tsx`: the three permission tests that asserted the
edit button collapsed into two delete-only tests, plus one new regression test that asserts
`can()` is never called with `product:create` or `product:edit`. That assertion is on the
permission probe rather than on rendered text on purpose — the header button lives in the
`useHeaderFeatures` zustand store, not in this component's DOM, so a text query could not
see it either way.

## Verification

- `grep` across `apps/` and `packages/` for `ProductEditor`, `toggleProductInCollection`,
  `products/add` and `Commerce.Editor` — no hits in tracked source (only a stale
  `node_modules/.vite` vitest cache file).
- `product:create` / `product:edit` are still used, but only by `ImportWizard.tsx` and the
  Taxonomy components — both untouched features with their own backend gates.
- Test run: see the branch's test log for this commit.
