# Commerce Categories & Collections Management Screen (Task 9) — 2026-07-23

Full design/plan reference:
- `Front/docs/superpowers/specs/2026-07-22-commerce-product-management-design.md`
- `Front/docs/superpowers/plans/2026-07-22-commerce-product-management.md`
- Follow-up to `2026-07-23-commerceVariantMediaPicker.update.md` (Task 6). Tasks 7/8 (inventory
  ledger + collection-membership editor, both inside the product editor) shipped without a
  separate update doc; this is the next standalone doc in the series.

## Problem

Merchants had no dedicated place to manage the category tree (create/rename/re-parent/
reorder/delete) or the collection list (create/rename/delete) — both were only reachable
indirectly through the product editor's per-product pickers (`BasicInfoSection`'s single
`categoryId` select, `CollectionsSection`'s membership chips).

## Solution

New, self-contained page at `apps/dashboard/src/app/(Console)/products/taxonomy/page.tsx` —
not tied to the product editor's form context:

1. **`CategoryTree.tsx`** — fetches the flat `GET /commerce/categories` list and builds the
   tree client-side via the existing `buildCategoryTree` util (Task 1), never reimplemented.
   Renders recursively with per-level indentation. Drag-and-drop uses `@dnd-kit`, same
   sensors/`closestCenter` pattern as `MediaSection.tsx`'s reorder grid, but with a
   **deliberate scope reduction**: a single top-level `DndContext` wraps nested
   `SortableContext`s (one per sibling group), so drag only reorders siblings within the same
   parent — dragging a node onto a node under a *different* parent is a no-op (the item snaps
   back). Re-parenting a category is done through `CategoryDialog`'s parent select instead.
   Sibling reorder PUTs `{parentId, position}` per affected node (partial-update semantics,
   matching `CollectionsSection`'s confirmed convention of PUTing only the field(s) that
   changed). Delete failures surface both `COMMERCE_CATEGORY_IN_USE` and
   `COMMERCE_CATEGORY_CYCLE` via `t_ec`, falling back to a generic message for unknown codes.
2. **`CategoryDialog.tsx`** — create/edit form (`name`, `parentId` select). The parent select
   is built from the same tree via a local `flattenTree` + depth-indent helper (mirrors
   `BasicInfoSection`'s pattern); when editing, the category's own subtree (itself + every
   descendant) is excluded from the options so an obvious self/ancestor cycle can't even be
   selected client-side — the server's `COMMERCE_CATEGORY_CYCLE` check remains the final
   authority for anything a stale client-side tree might miss.
3. **`CollectionsList.tsx`** — card/row list from `GET /commerce/collections`, each row
   showing `productIds.length` as "{n} کالا". **No manual/rule-based collection-type
   badge or toggle anywhere** — confirmed dropped from the design spec (spec correction
   item 6): no such field exists on the backend at all.
4. **`CollectionDialog.tsx`** — name-only create/edit form. Editing a collection's product
   membership stays in the product editor's `CollectionsSection` (Task 8); this dialog only
   ever sends `{name}`, relying on `PUT /commerce/collections/:id` treating omitted fields as
   "leave unchanged" (the same partial-update behavior `CollectionsSection#handleToggle`
   already relies on when it PUTs `{productIds}` alone).
5. **`taxonomy/page.tsx`** — two-pane layout (`LayoutPage`, `grid lg:grid-cols-2`, same
   breakpoint `orderDetails.tsx` uses for its own two-pane grid). Both panes' "new" actions
   live in the header via `useHeaderFeatures`, matching `ProductListPage.tsx`'s single-button
   convention extended to two buttons. Each list component owns its own SWR fetch + dialog
   state; the page only owns the two create-dialog `open` booleans so the header buttons can
   toggle them from outside the list components.
6. New `Commerce.Taxonomy.*` i18n namespace in `fa.json` (`Category`, `CategoryDialog`,
   `Collection`, `CollectionDialog` sub-namespaces) plus two new `ERROR_CODES` entries:
   `COMMERCE_CATEGORY_IN_USE`, `COMMERCE_CATEGORY_CYCLE` (also added to the `ExceptionMessage`
   `ERROR_CODES` union type).

## Changes

- New: `apps/dashboard/src/components/Commerce/Taxonomy/CategoryTree.tsx` (+ test)
- New: `apps/dashboard/src/components/Commerce/Taxonomy/CategoryDialog.tsx`
- New: `apps/dashboard/src/components/Commerce/Taxonomy/CollectionsList.tsx`
- New: `apps/dashboard/src/components/Commerce/Taxonomy/CollectionDialog.tsx`
- New: `apps/dashboard/src/app/(Console)/products/taxonomy/page.tsx`
- Modified: `apps/dashboard/src/types/exceptionMessage.ts` (added
  `COMMERCE_CATEGORY_IN_USE`/`COMMERCE_CATEGORY_CYCLE` to the `ERROR_CODES` union)
- Modified: `apps/dashboard/src/messages/fa.json` (new `Commerce.Taxonomy.*` namespace; two new
  `ERROR_CODES` entries)

## Known scope reduction

Drag-to-re-parent (dragging a category onto a node under a different parent to move it there)
was explicitly scoped down to drag-to-reorder-siblings-only, per the task brief's own
allowance for this simplification when full drag-to-reparent risks a half-working interaction.
Re-parenting remains fully available — just through `CategoryDialog`'s parent select, not
drag. No navigation entry point (sidebar link) to `/products/taxonomy` was added — out of
scope for this task per the brief's file list; a future task should wire up navigation.

## Verification

`cd apps/dashboard && npx vitest run src/components/Commerce/Taxonomy/CategoryTree.test.tsx`:

```
✓ src/components/Commerce/Taxonomy/CategoryTree.test.tsx (7 tests)

Test Files  1 passed (1)
     Tests  7 passed (7)
```

Also re-ran the full `src/components/Commerce` suite (95 tests, 13 files) to confirm the
shared `exceptionMessage.ts`/`fa.json` edits didn't regress anything already shipped — all
passed.
