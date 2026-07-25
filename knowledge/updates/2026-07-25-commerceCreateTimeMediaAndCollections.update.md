# Media and Collections at Product Creation Time — Front (2026-07-25)

Front half of the change. Backend reference:
`Back/knowledge/updates/2026-07-25-commerceCreateTimeMediaAndCollections.update.md`.

## Problem

`MediaSection` and `CollectionsSection` both rendered a `saveProductFirst` placeholder in
create mode, so a merchant had to save a product, land in the editor, and only then add images
or put it in a collection.

Category was never affected — it is a plain `categoryId` field in `BasicInfoSection` and has
always been part of the create payload.

## Solution

### Collections — recorded in the form, sent with the create payload

`ProductFormValues` gained `collectionIds: string[]`. In create mode `CollectionsSection` now
renders `PendingCollectionsPicker`: the same chips, but bound to that form field via
`FormField` instead of PUTting each collection. `buildCreatePayload` sends the ids and the
backend writes the membership rows in the same transaction as the product.

Edit mode is unchanged — it still writes through `PUT /commerce/collections/:id`, and
`collectionIds` stays `[]` there (`mapProductDetailToFormValues`). The collections list is now
fetched in **both** modes (the SWR key used to be `null` in create mode).

### Media — queued in memory, uploaded straight after create

In create mode `MediaSection` renders `PendingMediaPicker`, which keeps the chosen `File[]`
(owned by `ProductEditorPage`, not the form — this keeps the zod schema serialisable) and shows
`URL.createObjectURL` previews with a remove button and a "cover" badge on index 0.

After `POST /commerce/products` succeeds, `uploadPendingMedia` posts each file to
`/commerce/products/:id/media` **sequentially, in array order**. Sequential is deliberate:
positions are assigned server-side in arrival order, so parallel uploads would make the cover
image non-deterministic.

If the product saves but some uploads fail, the create is **not** failed — the product is
already committed. The user gets `Toast.createdWithMediaErrors` (with the failure count)
instead of a plain success and still lands in the editor, where the upload can be retried
against the now-existing product.

Object URLs are revoked in a `useEffect` cleanup; without it every re-pick would leak a blob
for the life of the page.

### Inventory — opening stock per variant

`InventorySection` ("تراز موجودی") was gated too. The ledger and the adjust-stock dialog both
need real variant ids, so those genuinely cannot work before the first save — but **opening
stock can**: `variants[].initialStock` is already part of the create payload, and the backend
seeds the inventory level plus a `manual`/`initial` ledger row from it.

So create mode now renders one row per variant currently in the form with an opening-stock
input, instead of a placeholder. It writes the **same** `variants[].initialStock` field the
Variants & pricing table already exposes, so editing it in either place stays in sync with no
extra wiring.

The input follows CLAUDE.md §18: a **text** input with `inputMode="numeric"` and
`onInputP2EHandler`, never `type="number"` (which blanks non-ASCII input so the Persian→English
conversion would never run), plus `formatNumber` for display and `useSelectOnFocus`.

## Changes

- `productForm.schema.ts` — `collectionIds` added to the interface, the zod object, the
  create-mode defaults and the edit-mode mapper.
- `ProductEditorPage.tsx` — `pendingMedia` state, `uploadPendingMedia`, `collectionIds` in
  `buildCreatePayload`, partial-success toast, props passed to `MediaSection`.
- `sections/CollectionsSection.tsx` — `PendingCollectionsPicker`; collections fetched in both
  modes.
- `sections/MediaSection.tsx` — `PendingMediaPicker`; `pendingFiles` / `onPendingFilesChange`
  props.
- `sections/InventorySection.tsx` — create mode renders the opening-stock table instead of the
  placeholder.
- `messages/fa.json` — `Commerce.Editor.Media.pendingHint`,
  `Commerce.Editor.Toast.createdWithMediaErrors`, `Commerce.Editor.Inventory.openingStockHint`,
  `Commerce.Editor.Inventory.Columns.openingStock`, and
  `ERROR_CODES.COMMERCE_COLLECTION_NOT_FOUND` (the backend code existed but had no Persian
  string, so it would have surfaced raw — CLAUDE.md §10).
- Tests updated: `CollectionsSection.test.tsx` and `MediaSection.test.tsx` replaced their
  "shows the save-first message" cases with create-mode behaviour cases;
  `productForm.schema.test.ts`, `InventorySection.test.tsx` and `VariantsSection.test.tsx`
  had `collectionIds: []` added to their hand-built `ProductFormValues` literals.
  `InventorySection.test.tsx` also swapped its placeholder case for two create-mode cases
  (opening-stock input writes the form field and formats via `formatNumber`; the input honours
  the §18 text-input contract).

## Verification

- `npx vitest run src/components/Commerce/ProductEditor` → **88 passed / 88**, 11 files.
- `npx tsc --noEmit` (apps/dashboard) → 268 error lines; **zero** relating to this change. The
  4 `collectionIds` errors this initially introduced in test literals were fixed.

### Pre-existing tsc noise in the touched files (not from this change)

- `Badge` rejecting `children`/`variant` (`IntrinsicAttributes & BadgeProps`) — a React-19
  typing mismatch that already affects untouched lines in these same files
  (`CollectionsSection.tsx:210`, `MediaSection.tsx:344`, `InventorySection.tsx`,
  `VariantsSection.tsx`). Importing `Badge` from `@/components/ui/badge` instead of the barrel
  was tried and changes nothing, so the barrel is not the cause.
- `zodResolver(schema)` — `ZodObject` not assignable to `ZodType`, a zod/@hookform-resolvers
  version mismatch that also fires in the untouched `VariantsSection.test.tsx`.
