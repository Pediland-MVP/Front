# Commerce Per-Variant Media Picker (Task 6) — 2026-07-23

Full design/plan reference:
- `Front/docs/superpowers/specs/2026-07-22-commerce-product-management-design.md`
- `Front/docs/superpowers/plans/2026-07-22-commerce-product-management.md`
- Follow-up to `2026-07-22-commerceVariantsPricing.update.md` (Task 5).

## Problem

Task 5 shipped the variant table with a disabled placeholder media button per row (tooltip:
"available in a future version"). Merchants need to assign a subset of the product's media
pool to an individual variant, and pick which one of those is that variant's own cover image
— e.g. showing the red T-shirt's photos when the "Red" variant is selected, instead of always
falling back to the product's implicit cover.

## Solution

1. **`VariantMediaPickerDialog.tsx`** — a modal (grid of the product's media pool as
   selectable tiles) that reuses `MediaSection.tsx`'s exact tile rules: video tiles render
   `posterUrl ?? url` (never an embedded/playing video), image tiles render `url` directly.
   Click toggles a tile's selection; the star button sets/unsets it as cover, auto-selecting
   the tile first if it wasn't already selected (deselecting the current cover tile clears the
   cover too). Full-replace semantics: `handleSave` always PUTs the complete current
   `mediaIds` array, never a delta — an empty selection is itself the "clear this variant's
   override, fall back to the product's cover" action, no separate reset button needed.
2. **Real backend gap, worked around deliberately (see code comment in `handleSave`)**:
   `GET /commerce/products/:id` does not return each variant's media assignment yet — Back's
   own Task 16 report explicitly flags wiring per-variant cover reads into the read path as a
   **future** task, not done. `setVariantMedia`'s PUT response is just `{variantId, count}`.
   A plain revalidating `mutate(key)` after a successful save would therefore immediately
   erase the just-saved assignment from the UI (the fresh GET response has no such field).
   Instead of the brief's literal "revalidate for fresh data" instruction, `handleSave` writes
   the known-good assignment straight into the SAME shared `/commerce/products/:id` SWR cache
   entry with `revalidate: false` (same "shared cache is the source of truth" mechanism Task 4
   established for upload/reorder/delete) and deliberately skips the follow-up plain
   revalidate. This means the assignment is visible for the rest of the session but resets to
   "unknown → shows the dashed product-cover placeholder" on a fresh page load, until a future
   backend task adds the field to the GET response (at which point this local write becomes
   redundant but harmless).
3. **`VariantsSection.tsx` wiring** — the media button now shows the variant's own cover
   thumbnail (resolved from `existingVariants[].media.coverMediaId` against the `media` pool)
   or a dashed "uses product cover" placeholder when no override is known. The button is
   **disabled with an explanatory tooltip** whenever the variant has no real, persisted
   backend `id` yet (a brand-new row added this session via "regenerate" or otherwise) —
   `PUT .../variants/:variantId/media` requires a real id, so it can never be called with one
   missing. One dialog instance is reused across all rows (`mediaPickerIndex` state), matching
   the approved mockup's single reused `modalVariantMedia`.
4. `ProductEditorPage.tsx` now passes `productId`/`media` (the product's pool) down to
   `VariantsSection`, alongside the existing `existingVariants`.

## Changes

- New: `apps/dashboard/src/components/Commerce/ProductEditor/VariantMediaPickerDialog.tsx`
  (+ test)
- Modified: `apps/dashboard/src/components/Commerce/ProductEditor/sections/VariantsSection.tsx`
  (`VariantsSectionProps` gained `productId`/`media`; `VariantRow` gained `variantId`/
  `mediaAssignment`/`mediaPool`/`onOpenMediaPicker`; wires the real media button + one shared
  `VariantMediaPickerDialog` instance)
- Modified:
  `apps/dashboard/src/components/Commerce/ProductEditor/sections/VariantsSection.test.tsx`
  (new describe block: disabled-for-unsaved-variant, dashed placeholder, cover thumbnail)
- Modified: `apps/dashboard/src/components/Commerce/ProductEditor/ProductEditorPage.tsx`
  (passes `productId`/`media` to `VariantsSection`)
- `apps/dashboard/src/messages/fa.json`: replaced the obsolete
  `Commerce.Editor.Variants.mediaPlaceholderTooltip` with `mediaUnsavedTooltip`/
  `mediaAssignTooltip`/`mediaEditTooltip`; added the new `Commerce.Editor.VariantMedia.*`
  namespace (dialog title/description/empty-pool/tile-aria-labels/cancel/save/toasts).

## Verification

`cd apps/dashboard && npx vitest run src/components/Commerce/ProductEditor/VariantMediaPickerDialog.test.tsx src/components/Commerce/ProductEditor/sections/VariantsSection.test.tsx src/components/Commerce/ProductEditor/sections/MediaSection.test.tsx src/components/Commerce/ProductEditor/ProductEditorPage.test.tsx`:

```
✓ src/components/Commerce/ProductEditor/VariantMediaPickerDialog.test.tsx (8 tests)
✓ src/components/Commerce/ProductEditor/sections/MediaSection.test.tsx (7 tests)
✓ src/components/Commerce/ProductEditor/ProductEditorPage.test.tsx (3 tests)
✓ src/components/Commerce/ProductEditor/sections/VariantsSection.test.tsx (13 tests)

Test Files  4 passed (4)
     Tests  31 passed (31)
```

## Known limitation (flagged for whole-branch review)

Because the backend doesn't yet expose per-variant media on `GET /commerce/products/:id`,
a merchant who sets a variant's cover, then reloads the page (or another session opens the
same product), will see the dashed "uses product cover" placeholder again even though a real
`commerce_variant_media` row still exists in the DB — the assignment isn't lost, just not
readable back yet. This needs a future backend task (adding `media`/`coverMediaId` to
`readOne`'s per-variant DTO, mirrored in `CatalogReadService`) before the frontend can display
it durably across reloads.
