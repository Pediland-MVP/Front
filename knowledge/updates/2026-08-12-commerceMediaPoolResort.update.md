# Resortable Product Images — 2026-08-12

Spec: `docs/superpowers/specs/2026-08-12-commerce-product-images-resort-design.md`
Plan: `docs/superpowers/plans/2026-08-12-commerce-product-images-resort.md`

## Problem

The product editor's media pool (`MediaSection.tsx`) showed images/videos in upload (arrival)
order with index 0 rendered as "cover", but a merchant had no way to change that order after
upload. The backend reorder endpoint for this (`PATCH /commerce/products/:id/media`) was already
built, tested, and permission-gated as part of the original media-endpoints work — it was simply
never called from the frontend.

## Solution

Drag-and-drop added to the media pool grid using `@dnd-kit` (already a dependency, already used
the same way in `apps/dashboard/src/components/Commerce/Taxonomy/CategoryTree.tsx`). No backend
change — the existing `MediaService.reorderMedia` is reused as-is.

## Changes

- `sections/SortableMediaTile.tsx` (new): the pool tile, now `useSortable`, with a dedicated drag
  handle separate from the existing ✕ remove button.
- `sections/MediaSection.tsx`: wraps the grid in `DndContext`/`SortableContext`
  (`rectSortingStrategy`, grid-aware), gains an `onReorder: (newOrder: EditorMedia[]) => void`
  prop. Drag is disabled whenever `isBusy` (same flag already gating the dropzone and remove
  buttons).
- `ProductEditorPage.tsx`: new `handleReorderMedia`, sharing the existing `mediaBusy` guard with
  `handleAddMedia`/`handleRemoveMedia`. Optimistically reorders the form's `media` field on drop;
  in edit mode also calls `PATCH /commerce/products/:id/media` and rolls back to the pre-drag
  order on failure. Create mode (no `productId` yet) is local-only — the order is simply what
  gets uploaded once the product is first created.
- `fa.json`: two new `Commerce.Editor.Media` keys, `reorderError` and `reorderHandle`.

## Verification

`ProductEditorPage.test.tsx` and `MediaSection.test.tsx` — 3 new reorder tests (create-mode
local reorder, edit-mode PATCH + cache refresh, edit-mode rollback + error toast) plus 3 new
`MediaSection`-level tests for the drag-end wiring. All pass; run with:
`cd apps/dashboard && npx vitest run src/components/Commerce/ProductEditor/sections/MediaSection.test.tsx src/components/Commerce/ProductEditor/ProductEditorPage.test.tsx`

No manual in-browser verification yet — flag for the user before this ships.
