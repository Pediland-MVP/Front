# Resortable Product Images — Design Spec

**Branch:** `feat/commerce-product-core` (Front worktree). No paired Back change.

**Why now:** The product editor's media pool (`MediaSection.tsx`) displays images/videos in
`position` order with index 0 rendered as "cover", but there is no way for a merchant to
change that order after upload — files land in upload (arrival) order and stay there. The
backend reorder endpoint for this was already built and tested as part of the original
media-endpoints work but has never been wired up from the frontend.

## Scope

Add drag-and-drop reordering to the product-editor media pool grid
(`apps/dashboard/src/components/Commerce/ProductEditor/sections/MediaSection.tsx`), backed
by the existing `PATCH /commerce/products/:id/media { mediaIds }` endpoint
(`Back/apps/core/src/commerce/media/media.controller.ts:85-103`,
`media.service.ts:244-271`) — verified during design review: validates every id belongs to
the product, transactional, re-indexes `position = array index`, fires `productUpdated`,
covered by `media.service.spec.ts`. **No backend changes.**

Out of scope:
- Per-variant media order/cover (`VariantMediaPickerDialog.tsx`, `commerce_variant_media`
  table) — independent of the product-pool order, untouched.
- Any change to how `position` is assigned on upload (stays arrival-order via
  `persistMedia`).

## Library

`@dnd-kit/core` + `@dnd-kit/sortable` — already a dependency of `apps/dashboard` and already
used for this exact pattern in `components/Products/FormCustomFields.tsx` +
`SortableFieldItem.tsx` (`DndContext`/`SortableContext`/`useSortable`, `PointerSensor` +
`KeyboardSensor` with `sortableKeyboardCoordinates`). No new dependency.

## Component changes

### `MediaSection.tsx`
- Wrap the tile grid in `DndContext` (`sensors`, `collisionDetection={closestCenter}`,
  `onDragEnd`) + `SortableContext` (`items={media.map(m => m.id)}`,
  `strategy={rectSortingStrategy}` — grid-aware, not `verticalListSortingStrategy`, since
  this grid wraps in 2D).
- Extract each tile into a new `SortableMediaTile` subcomponent (mirrors
  `SortableFieldItem`): calls `useSortable({ id: item.id, disabled: isBusy })`, renders the
  existing tile markup unchanged, plus a small grip-icon drag handle with
  `{...attributes} {...listeners}` — the handle is a separate element from the existing ✕
  remove button so the two never compete for the same pointerdown.
- `onDragEnd` computes `arrayMove(media, oldIndex, newIndex)` and calls a new
  `onReorder: (newOrder: EditorMedia[]) => void` prop. No API call here — that lives in the
  page, matching how `onAdd`/`onRemove` are already split (component stays "presentational
  plus a file picker", per its existing doc comment).
- New i18n key `Commerce.Editor.Media.reorderHandle` — aria-label for the handle (e.g.
  `"جابجایی {name}"`), `fa.json` only (en.json translated later, per CLAUDE.md §8).

### `ProductEditorPage.tsx`
New `handleReorderMedia(newOrder: EditorMedia[])`, placed next to `handleAddMedia` /
`handleRemoveMedia`, sharing the same `mediaBusy` ref + `isMediaBusy` state guard:

1. Snapshot the current `media` value (for rollback).
2. Optimistically `setValue('media', newOrder, { shouldDirty })` immediately — a drag needs
   instant visual feedback, unlike a button-triggered add/remove where a brief busy state is
   acceptable.
   - **Create mode** (`!productId`): `shouldDirty: true` — this is a local-only reorder of
     the still-pending upload queue (matches how the initial queued files are marked dirty).
     No API call; done here.
   - **Edit mode** (`productId` set): `shouldDirty: false` — an immediately-persisted change
     isn't an "unsaved" one, matching `handleRemoveMedia`'s convention.
3. Edit mode only: `markMediaBusy(true)`; `await api.patch('/commerce/products/:id/media',
   { mediaIds: newOrder.map(m => m.id) })`.
   - On success: fire-and-forget `void mutate(productDetailKey(productId))` (same pattern as
     `handleRemoveMedia`) to keep the SWR cache fresh; do not overwrite the just-set local
     order from the response (the response is `{ count }`, not the refreshed media list).
   - On failure: restore the pre-drag order from the snapshot and `toast.error(t('Media.reorderError'))`.
   - `finally`: `markMediaBusy(false)`.

Drag is disabled whenever `isMediaBusy` is true (`useSortable({ disabled: isBusy })` in the
tile), so a reorder can't start mid-upload/mid-delete/mid-reorder, matching the existing
dropzone/remove-button busy gating.

## New translation keys (`fa.json`, `Commerce.Editor.Media` namespace)
- `reorderError`: "جابجایی ترتیب فایل‌ها انجام نشد. دوباره تلاش کنید." (matches the existing
  `uploadError`/`deleteError` phrasing)
- `reorderHandle`: "جابجایی {name}"

## Testing
`ProductEditorPage.test.tsx` exists but currently has **no** coverage of
`handleAddMedia`/`handleRemoveMedia` in either mode (verified while writing the implementation
plan — corrected from an earlier draft of this spec, which assumed coverage that isn't there).
This plan adds first-time coverage of the media-handler pattern via `handleReorderMedia`:
- Create mode: dragging reorders `media` locally, `shouldDirty: true`, no API call.
- Edit mode success: PATCH called with the new id order; cache `mutate` invoked; no error
  toast.
- Edit mode failure: order rolls back to the pre-drag snapshot; `Media.reorderError` toast
  shown.

Per CLAUDE.md §7 (not a TDD task): run only `ProductEditorPage.test.tsx` (and, if a new
`MediaSection.test.tsx` is added for the drag-handle wiring, that file too) — not the full
suite.

## Non-goals / accepted trade-offs
- No backend change — the existing `reorderMedia` service method is reused as-is.
- No change to which tile is "cover" beyond it already being purely positional
  (`index === 0` after reorder) — reordering to put a different image first makes that image
  the new cover, which is the intended effect of this feature.
- Per-variant media assignments are untouched by a product-pool reorder; if a variant's
  `mediaIds` pointed at image B before B moved from position 3 to position 0, that variant
  assignment is unaffected (it's keyed by id, not position).
