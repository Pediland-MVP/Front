# Commerce Product Editor — rebuilt from the claude design — 2026-07-27

Full design/plan reference (in the outer MVP repo, not this Front repo):
- `docs/superpowers/specs/2026-07-27-commerce-product-editor-design.md`
- `docs/superpowers/plans/2026-07-27-commerce-product-editor-front.md`

Directly reverses `2026-07-27-commerceProductEditorRemoval.update.md`, which deleted the previous
editor. This is a rebuild, not a revert: none of the 44 removed files came back unchanged.

## Problem

Commit `18456153` deleted the whole product editor — both routes, the 44-file `ProductEditor`
tree, the `Commerce.Editor` i18n namespace, and the two entry points on the product list. The
`/commerce/*` catalog API was untouched, so the dashboard could list and delete products but
could not create or edit one.

The old editor was also structurally at odds with the design it was being pushed toward: a
scrollspy the design does not have, positional `valueIndexes` stored in the form (so reordering an
axis silently repointed every variant row), and regeneration running inside an effect (so its own
delete buttons appeared to do nothing).

## Solution

Rebuilt from the "Befroosh Design System" artifact's `Product editor with variations` template —
nine numbered steps in one scrolling column, a 308px sticky rail, a sticky glass top bar, a
floating bulk-edit bar and four dialogs — on our own infrastructure: Tailwind + the tokens already
in `globals.css`, `@/components/ui`, react-hook-form + zod, SWR, sonner, `next-intl`.

Three structural choices carry the rebuild:

- **react-hook-form owns the state.** `register` inputs are uncontrolled, so a keystroke in a
  price cell re-renders nothing — with up to 2000 rows × 5 inputs that is the difference that
  matters. `isDirty`, `dirtyFields`, `setFocus` and per-path errors come free.
- **The form stores stable option-value KEYS, not positional `valueIndexes`.** Positions are
  derived once, at payload time, against the same options array the payload just built, so an axis
  or a value can be reordered without a row quietly pointing somewhere else.
- **Regeneration runs in the axis event handlers, never in an effect**, and a deliberately deleted
  combination is remembered until the axis values themselves change.

### Accepted trade-offs

Three, all deliberate, all recorded in the spec:

1. **No status / kind / shipping control.** The design's top-bar pill is a derived readiness hint
   (`عنوان ندارد` → `۳ تنوع بدون قیمت` → `آماده انتشار`), not a status picker, and the design draws
   no `kind` or `shippingCost` control. Create hardcodes `active` / `physical` / `0`; update omits
   all three keys so the backend leaves them unchanged. **Regression:** draft products, digital
   products and a non-zero shipping cost become unsettable anywhere in the dashboard. Existing
   values are readable and survive editing. If they are needed they want their own surface, not a
   bolt-on here.
2. **Media sits outside Save/Revert.** `commerce_product_media.productId` is `NOT NULL`, so a
   dropped file must be uploaded to get an id the variant media picker can point at. Edit mode
   therefore uploads on drop and deletes on ✕ immediately — بازگردانی does not bring a deleted file
   back. Create mode queues object URLs and uploads them sequentially right after the product is
   created, so arrival order becomes `position` and index 0 is the cover.
3. **A variant with no price blocks the save.** `commerce_product_variant.price` is `NOT NULL` with
   `CHECK price >= 0`, so the design's "بدون قیمت" row cannot be persisted. The red tint and the
   footer count stay exactly as drawn and Save refuses with `۳ تنوع قیمت ندارد…`. No placeholder
   price is ever written and no row is silently deactivated.

## Changes

All paths under `apps/dashboard/src/`.

- `components/Commerce/ProductEditor/utils/{editorNumber,markdown}.util.ts` — Persian-digit
  parse/format (CLAUDE.md §18) and the markdown ⇄ HTML bridge for the WYSIWYG description.
  `markdownToHtml` escapes quotes as well as angle brackets, because the link rule interpolates a
  captured url into `href="…"`.
- `components/Commerce/ProductEditor/variant/variantTree.util.ts` — combination expansion, parent
  roll-up, stale-row detection, discount. No React import.
- `components/Commerce/ProductEditor/productEditor.schema.ts` — `ProductFormValues` +
  `buildProductEditorSchema(t)`. Per-cell issue paths (`['variants', n, 'price']`) so the grid can
  tint the exact offending input. Mirrors the DB rules: price non-null, `compareAtPrice > price`,
  max 3 axes, max 2000 variants.
- `components/Commerce/ProductEditor/productEditor.mapping.ts` — detail → form values → create /
  update payloads. Also the only place `sku`, `weight`, `salePrice`, `saleStartsAt`, `saleEndsAt`,
  `allowBackorder` and `isActive` are round-tripped: they have no UI in this design, and
  `PUT /commerce/products/:id` replaces the whole variants array, so dropping them would clear
  every SKU in the catalogue.
- `components/Commerce/ProductEditor/{useProductLoad,useProductSave}.ts` — the four SWR keys, and
  the save sequence. The order is forced by the schema, not chosen: product → media (sequential,
  because `position` is arrival order) → re-read (variant ids exist nowhere else) → variant media →
  collection membership (owned by the collection side). Only the product write can fail the save.
- `components/Commerce/ProductEditor/ProductEditorPage.tsx` — the shell: one `useForm`, the nine
  sections, the rail, all four dialogs, the media pool, the permission gate, and the
  expand-then-focus handling for an invalid submit.
- `components/Commerce/ProductEditor/{sections,variant,rail,dialogs,ui}/*` — the nine steps, the
  two-level variant grid with roll-ups and the bulk bar, the collections/tags rail, and the shared
  chrome.
- `app/(Console)/products/add/page.tsx`, `app/(Console)/products/[id]/{page,product}.tsx` — the two
  routes, restored.
- `components/Commerce/ProductList/{ProductListPage,CommerceProductCard}.tsx` — the `product:create`
  header button and the `product:edit` card button, restored with the conditional footer rounding.
- `components/Commerce/ProductList/ProductListPage.test.tsx` — the regression test added in
  `18456153` (`can()` is never asked for `product:create`/`product:edit`) was correct for a
  read-only list and is now wrong. Replaced by four tests asserting the buttons themselves; the
  header one renders the node captured from the `useHeaderFeatures` store, because that button
  never enters the component's own DOM.
- `messages/fa.json` — the `Commerce.Editor` namespace, plus `Commerce.List.add` and
  `Commerce.List.Card.edit` back.
- `styles/globals.css` — the variant-grid and prose rules.

No backend change. The editor becomes a consumer of `GET /commerce/tags` and
`PUT /commerce/products/:id/variants/:variantId/media` again; both already exist.

## Verification

- `cd apps/dashboard && pnpm vitest run src/components/Commerce` — 21 test files / 185 tests
  passing, including the pure units (`variantTree`, `productEditor.schema`,
  `productEditor.mapping`, `markdown.util`, `editorNumber.util`), the behavioural variant-table
  cases (a deleted row stays deleted; a parent cell writes every child; blanking a parent showing a
  *range* does nothing; bulk `-10%` rounds to 1,000 tooman and skips unpriced rows), the
  `useProductSave` create-sequence order and its media-failure warning, and the restored
  `ProductListPage` entry points.
- `tsc --noEmit` sits at the pre-existing 205-error app-wide baseline (mostly `@befroosh/ui`'s
  `BadgeProps` missing `children` and a `zod` 3/4 hoisting collision, both unrelated to this page)
  — zero new errors from this branch.
- Out of scope, unchanged from the spec: E2E, visual regression, any `Back/` change.

## Known gaps (minor, deferred)

- The `›` category-path separator is an i18n value in the page shell but is still hardcoded in
  `dialogs/CategoryPickerDialog.tsx` and `dialogs/PreviewDialog.tsx`. The RTL-correct flip to `‹`
  should land across all three together.
- `Attributes.removeValue` and `Variants.remove` both render as `حذف {x}`, so an axis chip's ✕ and
  its variant row's ✕ read identically to a screen reader. Copy fix, not yet done.

## Final whole-branch review — fix wave (2026-07-28)

The pre-merge review found two CRITICAL data-loss paths and six IMPORTANT items. All are fixed in
one wave; the two criticals are covered by tests that were confirmed to FAIL against the pre-fix
code first.

### C1 — an axis-shape change no longer strips a variant of its identity

`buildRow` hardcoded `sku: null, weight: null, salePrice/saleStartsAt/saleEndsAt: null,
allowBackorder: false, isActive: true` and minted no `id`, and `donorOf` carried only
price/compare/stock/infinite/mediaIds. Because `buildUpdatePayload` sends
`cascadeDeleteVariants: true` and `PUT /commerce/products/:id` replaces the whole variants array,
a regenerated row arriving without an `id` is a DELETE of the real variant plus a blank INSERT —
every SKU gone, every weight gone, and a deliberately deactivated variant back on sale. The price
carried over, so the grid looked unchanged and only a toast hinted at it.

- `RowSeed`/`buildRow` now carry the donor's `id` and all seven no-UI fields.
- `id`, `sku` and `stock` are IDENTITY/QUANTITY and go to the first taker only (one donor can feed
  three combinations); everything else describes the product and is copied to all of them.
- `infinite` moved from the stock claim to the template set — ∞ is a tracking mode, not a count,
  and gating it left the extra rows reading "no stock" instead of "untracked".
- `ProductEditorPage.handleAxisChange` rebuilt the solo row from `buildEmptyProductForm()` when the
  LAST axis was removed, losing the same seven fields plus the id. It now restores the dropped row
  itself with an emptied selection.

**A pure axis REORDER is now a permutation, not a regeneration.** `valueIds` is positional, so
`move()` left every row's array in the old order and `orphanRowIndexes` flagged all of them — one
cosmetic "move up" click, with no confirmation, wiped every SKU in the product. New pure helper
`realignValueIds(axes, valueIds)` re-sorts a row into the current axis order (or returns `null`
for a genuine orphan, exactly the set `orphanRowIndexes` reports), and `syncVariants` applies it
through `useFieldArray`'s `update` before anything else looks at the rows. Nothing is added,
nothing is removed, no id is ever at risk. `update` rather than `setValue` because the grid groups
and labels off `fields`, which a `setValue` would leave showing the old axis order.

### C2 — removing one of two axes no longer blanks the prices

`donorOf` matched with `row.valueIds.every(id => combo.includes(id))`, which only holds when the
combination GROWS. Removing an axis makes each orphan LONGER than its target, so no donor was
found and every row fell back to `basePrice`/`baseCompare`/`baseStock` — which
`mapDetailToFormValues` deliberately sets to null on a loaded product. Six priced variants came
back blank, zod then blocked Save, and the work was recoverable only through بازگردانی.

`donorOf` now also matches the shrink direction (`combo.every(id => row.valueIds.includes(id))`,
first match wins). `Attributes.confirmAxisBody` was rewritten to say what actually happens: the
rows merge, one row per remaining combination survives with its price/stock/media, the rest go.

### I3 — collection membership diffs against a FRESH list

`PUT /commerce/collections/:id` replaces the whole `productIds[]`, and the baseline came from
`useSWRImmutable`, which by definition never revalidates. Opening the editor at 10:00, somebody
else adding product B to a collection at 10:05, and ticking that collection at 10:10 wrote B
straight out of it. `save` now `await mutate(COLLECTIONS_KEY)` immediately before the write and
diffs against what comes back (falling back to the cached list only if the revalidation answers
nothing).

### I4 / I5 — media failures are reported instead of swallowed

`saveVariantMedia` sat inside a bare `catch {}`: the first failing PUT aborted the loop, the rest
were never attempted, and the merchant saw "تغییرات ذخیره شد". It now catches per row, keeps
going, and returns a failure count. `buildMediaIdMap` returns `{ map, incomplete }` — its
count-mismatch bail-out used to drop every new photo's variant assignment silently. Both route
into a new `Toast.savedWithVariantMediaErrors` warning. Neither fails the save: the product is
already committed.

### I6 — validation errors outside `variants` are visible

`onInvalid` scanned only `errors.variants`, and Attributes/Specs rendered no error text and no
`data-bad`, so a nameless axis produced "موردهای قرمز را درست کنید" with nothing red on screen.
The option-name input and both spec inputs now tint from `errors.options`/`errors.specs` and show
the message, and `firstErrorPath` walks title → options → specs → variants in the page's own
reading order to pick the input `setFocus` jumps to.

### I7 — video no longer renders as a broken image

`CommerceProductMedia.posterUrl` is the resolved poster frame and `toEditorMedia` never read it,
so every surface except step ۴ put the video FILE through `<img>`/`next/image`. `EditorMedia`
gained `posterUrl`, and a shared `posterOf(item)` returns the still to draw (`null` when there is
none — a create-mode queued video). Applied to the variant grid rows, the bulk bar, the variant
media picker and the preview dialog; the picker and preview fall back to a real `<video>` element
when there is no poster, and step ۴'s `<video>` gained a `poster` attribute.

### I8 — four shared types single-sourced

Structurally identical duplicates are the dangerous kind: adding `posterUrl` to one `EditorMedia`
and not the other would have diverged with no compiler error. Done BEFORE I7 for exactly that
reason. `EditorMedia` → `productEditor.schema` (MediaSection re-exports), `EditorConfirm` →
`dialogs/ConfirmDialog` (AttributesSection re-exports), `VariantMediaTarget` →
`variant/VariantLeafRow` (the picker re-exports), `MAX_ATTRS` → `productEditor.schema`
(AttributesSection re-exports, the pattern `MAX_VARIANTS` already used).

### Cheap items from the ledger

- `٪` hardcoded in both variant rows → `Variants.discountBadge`; `›` hardcoded in
  `CategoryPickerDialog` and `PreviewDialog` → the existing `Category.pathSeparator` (CLAUDE.md §8).
- Bulk bar: `اعمال` with an empty box silently did nothing — the button is now disabled with a
  `Bulk.applyDisabled` title.
- Steps ۵/۶ locked on `options.length > 0`, so pressing "افزودن ویژگی" greyed them out before any
  variant existed. They now count axes that actually HAVE values, the same set `axesOfValues` keeps.
- Deleted the dead `editorInputCell` and `editorBand` exports.

### Verification

- `pnpm vitest run src/components/Commerce` — 21 files / **199** tests (was 185). The 14 new ones:
  4 in `useVariantSync.test.ts` (donor id + all seven fields carried on a grow; id/sku claimed by
  exactly one of three replacements; a pure reorder orphans nothing; the shrink-direction donor),
  7 pure `realignValueIds` cases, and 3 in `useProductSave.test.ts` (fresh-list collection diff,
  variant-media failure warns instead of claiming success, `buildMediaIdMap`'s `incomplete` flag).
- **Negative control:** with `useVariantSync.ts` and `variantTree.util.ts` reverted to the pre-fix
  commit, exactly those 4 critical tests fail and the other 10 in the file still pass.
- `tsc --noEmit` — 205 errors, byte-identical to the pre-fix baseline (zero new).
- `eslint` on every changed file — 0 errors, 3 warnings, all three pre-existing on untouched lines.

### Still deferred (unchanged, out of scope for this wave)

The `packages/ui` `Badge` children typing gap, the repo-level zod 3/4 dedupe, the case-sensitive
collection-name match, the `Attributes.removeValue` / `Variants.remove` a11y label collision, the
unscoped `useWatch` perf items, CSS scoping, and `front-back-relations.md`.
