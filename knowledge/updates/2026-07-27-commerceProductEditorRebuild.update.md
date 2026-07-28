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
