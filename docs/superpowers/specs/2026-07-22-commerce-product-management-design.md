# Commerce Product Management (Dashboard) — Design Spec

**Branch:** `feat/commerce-product-core` (paired with the already-committed, not-yet-merged
Back branch of the same name — see `Back/knowledge/updates/2026-07-22-commerceProductCore.update.md`
and `Back/knowledge/updates/2026-07-22-commerceOrderProductFkFix.update.md`).

**Why now:** Back's `feat/commerce-product-core` replaced the legacy authenticated product
CRUD routes (`/products`, `/vitrin`) with a new `/commerce/...` API (freeform variants,
media pool, inventory ledger, categories/collections, CSV/XLSX bulk import). The dashboard's
current `apps/dashboard/src/app/(Console)/products/*` pages still call the removed routes —
they are broken today against that backend and must be replaced, not extended.

**Design reference:** An interactive HTML mockup was built and approved by the user
(list, product editor, categories/collections, bulk import — all four screens, working
JS interactions for the variant generator, per-variant media picker, and import wizard
steps). This spec is the durable, text form of that approved design, corrected against the
**real** backend API surface (the mockup was drafted before the full API enumeration; a few
mockup details don't map to real fields — flagged explicitly below as "Correction from mockup").

## Scope

Replace `apps/dashboard/src/app/(Console)/products/*` and
`apps/dashboard/src/components/Products/*` with a new implementation against
`/commerce/...`. Four screens:

1. Product list (`/products`)
2. Product editor (`/products/add`, `/products/[id]`)
3. Categories & collections (`/products/taxonomy`)
4. Bulk import (`/products/import`)

Out of scope for this pass: the public buyer-facing read path (`LegacyProductReadService`,
`GET /products/:id` unauthenticated route) — untouched, not a dashboard concern. DM
settings (`CommerceDmSettingsController`) — separate, not part of this UI pass.

## Global conventions (apply to every screen — from the Front design-system research)

- RTL, Persian-first (`fa` messages under `apps/dashboard/src/messages/Console/` or the
  existing `Products` namespace, extended in place — see Task list).
- Reuse existing primitives only, no new design-system components: `@/components/ui`
  (`Button`, `Card`, `Dialog`/`Drawer`, `Tabs`, `Table`, `Badge`, `Switch`, `Select`,
  `Form`/`FormField`), `@/components/ui-custom` (`FileUploader`, `SearchInput`,
  `SearchToggleButton`, `ButtonLoading`, `LoaderSpin`).
- Header actions (search toggle, primary "Add" button) go through
  `useHeaderFeatures().setButtons/setTools` in a page-level `useEffect` with cleanup —
  never render action buttons inline in the page body (existing convention, see
  `ProducstCardList.tsx`).
- List pages: responsive card grid (`grid gap-3 md:grid-cols-3 2xl:grid-cols-4`) +
  `ItemsPagination`, matching `ProducstCardList.tsx` — not `DataTable` (products are
  visual/image-led).
- Money/quantity inputs: the canonical `onInput={onInputP2EHandler}` +
  `value={formatNumber(field.value)}` + `onFocus={useSelectOnFocus().onFocus}` +
  numeric `onChange` pattern from `FormProductDetails.tsx` (CLAUDE.md §18) — every price,
  stock, and SKU-adjacent numeric field in the new UI uses this, no exceptions.
- All amounts are integers in minor currency unit (تومان), matching the backend's
  `price`/`compareAtPrice`/`salePrice`/`shippingCost` being `bigint` columns — never send
  floats.
- Permission-gate every mutation the same way the legacy page did:
  `usePermissions().can('product:create'|'product:edit'|'product:delete')`, but map to the
  real backend permission constants `PERMISSIONS.PRODUCT_VIEW/CREATE/EDIT/DELETE` (confirm
  exact frontend permission-slug spelling against `usePermissions` call sites elsewhere —
  task will grep for the existing convention rather than invent one).
- Toasts: `sonner`'s `toast.success`/`toast.error` after every mutation, matching backend
  `ResponseMessage`/`ExceptionMessage` `code` via `t_ec` (CLAUDE.md §10).
- SWR for all reads; mutate the relevant list key after every write
  (`mutateIncludeStringKey('/commerce/products')`, etc.), matching `ProducstCardList.tsx`'s
  existing pattern.

## Screen 1 — Product list

`GET /commerce/products?page&limit&search&status&kind&categoryId` →
`PaginatedResult<CommerceProductListItemDto[]>` (fields: `id, title, slug, status, kind,
variantCount, minPrice, maxPrice, needsStockReview, updateDate`). No client-side sort param
exists — server always orders by `updateDate DESC`; **do not build a sort-order control**,
only status/kind/category filter chips + search (Correction from mockup: the mockup's
"مرتب‌سازی: جدیدترین ▾" chip has nothing to bind to — drop it).

Card shows: thumbnail from `coverMediaUrl: string | null` (added to
`CommerceProductListItemDto` on the Back branch specifically for this UI — see
`Back/knowledge/updates/2026-07-22-commerceProductListCoverMediaUrl.update.md`, commit
`8106a630`). `null` → type-based placeholder icon (no image uploaded yet), matching the
mockup's per-type gradient tile as the empty state, not as the default state.

Price display: `minPrice`/`maxPrice` from the list item — if `minPrice === maxPrice` show one
price; if they differ, show "از {minPrice} تومان" (starting-from), not a fake strikethrough
(Correction from mockup: the mockup showed an old/now strikethrough price per card, which
implied a single compareAtPrice per product — the real model has compareAtPrice **per
variant**, not per product, so a product-level card cannot show a meaningful strikethrough
unless every variant shares the same compareAtPrice; simplest correct behavior is the
price-range display above).

Status chips: `فعال` (ACTIVE) / `پیش‌نویس` (DRAFT) / `آرشیو شده` (ARCHIVED) map to
`CommerceProductStatusEnum` — drop the mockup's "اتمام موجودی" (out-of-stock) chip, since
stock is per-variant, not a product-level filter the list endpoint supports; instead surface
`needsStockReview` as a badge on the card itself (this flag exists precisely to mean "a
variant here needs your attention").

## Screen 2 — Product editor

Desktop: **one continuous scrollable page**, left nav is a scrollspy (click → smooth-scroll
+ highlight; scrolling also re-highlights) — not tabs. Mobile: left nav becomes a horizontal
tab bar, one section visible at a time. (This exact behavior was built and approved in the
mockup; carry it over unchanged — see mockup CSS/JS for the scrollspy `IntersectionObserver`
approach, reproduce the same mechanism.)

Sections, in order, each mapped to real fields:

1. **اطلاعات پایه (Basic info)** — `title` (255), `description` (text), `status` (enum
   select), `kind` (enum select, **locked/disabled once the product has ≥1 order line** —
   backend returns `COMMERCE_KIND_LOCKED` on an attempted change; the UI must disable the
   `kind` select and show why, not just let the submit fail). `categoryId` single-select
   (flat list from `GET /commerce/categories`, client builds the indent/tree for display).
2. **رسانه (Media)** — pool grid backed by `POST/DELETE/PATCH /commerce/products/:id/media`.
   Upload via existing `FileUploader` (`multiple` mode). Reorder via drag (backend:
   `PATCH .../media` with the full ordered `mediaIds[]`). First position = implicit product
   cover (no separate flag) — exactly as researched and built in the mockup.
3. **تنوع‌ها و قیمت (Variants & pricing)** — options builder (max **3** options,
   `CommerceOptionStyleEnum`: dropdown/button/color — mockup only showed free-text values;
   add the style picker per option, since color-style options materially change the
   variant-table swatch rendering and the backend models it explicitly). Variant table is
   generated from the cartesian product of option values (mirrors mockup's
   "بازسازی جدول تنوع‌ها" behavior) but capped at **2000 variants** (`VARIANT_LIMIT`) — show
   a hard error, not a silent truncation, if the product of value counts exceeds it.
   Per-variant columns: SKU, `price` (required), `compareAtPrice` (optional, must be
   `> price`, renders as the struck-through "was" price), `salePrice` +
   `saleStartsAt`/`saleEndsAt` (optional, must be set together, `salePrice < price`),
   `trackInventory` toggle, `allowBackorder` toggle (mockup didn't have this — add it, it's
   a real field), `isActive` toggle, per-variant media button (already built in the
   mockup — `PUT .../variants/:variantId/media`, `mediaIds[]` + optional `coverMediaId`).
   At least one variant must stay active/live at all times (`assertHasLiveVariant` — block
   deactivating the last one client-side with an inline message, don't wait for the 400).
   **Correction from mockup**: `valueIndexes` sent to the backend are positional indexes
   into the submitted `options[]`/`values[]` arrays, not UUIDs — the create/update payload
   builder must track this mapping precisely, it is not "just send the variant's option
   value ids."
4. **موجودی (Inventory)** — ledger read via
   `GET /commerce/products/:id/movements/:variantId?page&limit` (`CommerceStockMovement[]`:
   `delta` [signed], `reason` enum, `referenceId`, `actorId`, `createDate` — **no free-text
   note field and no stored resulting-balance column**). **Correction from mockup**: drop
   the "یادداشت" (note) input from the adjust-stock dialog and the "یادداشت" column from the
   ledger table entirely — the backend has nowhere to persist either. Show `referenceId`
   translated by `reason` instead (`order` → "سفارش #{referenceId}", `import` → "وارد کردن
   گروهی", `manual` → "—", etc.). Reconstruct the "موجودی پس از آن" (balance-after) column
   client-side: start from the variant's current `onHand` (from the product detail) and walk
   the DESC-ordered list, subtracting each row's `delta` as you go down to get the balance
   *before* that row applied (so balance-after of row *i* = balance-before of row *i-1*).
   Adjust-stock action is `PATCH /commerce/products/:id/stock` with body
   `[{variantId, onHand, lowStockThreshold?}]` — **`onHand` is the absolute target, not a
   delta.** The mockup's "نوع تغییر" (افزایش/اصلاح/کسر) dropdown has no backend counterpart
   (reason is always recorded as `manual` for user-initiated edits) — keep it as a
   UI-only framing control that just changes the sign/helper text of a single "new stock"
   number input, and do not claim it is persisted as a distinct reason.
5. **دسته‌بندی و کالکشن (Categories & collections)** — category is actually a single
   `categoryId` on the product (Basic Info tab handles it) — **remove this as a separate
   assignment surface for category** (Correction from mockup: the mockup showed
   multi-category chips on the product; the real model is one product → one nullable
   category, not many). Collection membership, however, is the reverse direction in the
   API — `PUT /commerce/collections/:id` takes `productIds[]` that **replaces** the whole
   collection's membership; there is no "add this product to a collection" endpoint scoped
   from the product side. Two implementation choices: (a) this section becomes read-only
   ("این کالا در این کالکشن‌هاست")؛ (b) toggling a collection chip here does a
   read-modify-write: fetch the collection's current `productIds`, add/remove this product's
   id, `PUT` the full list back. Go with (b) for parity with the mockup's toggle UX, but
   name the helper function so the read-modify-write isn't hidden inside a generic-looking
   "add to collection" call — implementers must know it's replacing a whole array.
6. **هزینهٔ ارسال (Shipping)** — `shippingCost` (bigint, product-level, matches mockup
   exactly — one field, no free-shipping-threshold toggle since that field doesn't exist on
   `CommerceProduct`; drop that switch from the mockup, it has nothing to bind to).

**Correction from mockup, cross-cutting**: `CommerceProductKindEnum` is `physical | digital`
only — the mockup's basic-info "نوع کالا" select had a third option "خدمت" (service). Drop
it; there is no `SERVICE` kind on the backend.

Create vs. edit: `POST /commerce/products` takes the full nested payload (`options[]` +
`variants[]` inline, using positional `valueIndexes`) in one call — there is no
multi-step wizard on the backend, so **the "create" flow is the same one continuous page as
edit**, just starting from empty state and doing a single `POST` on first save instead of
`PUT`. This matches the mockup's structure already (it never modeled create as a separate
multi-step flow).

## Screen 3 — Categories & collections

`GET /commerce/categories` returns a **flat** list (`id, name, slug, parentId, position`) —
the frontend builds the parent→children tree client-side (Correction from mockup: the tree
nesting in the mockup was static markup; the real implementation needs a
`buildCategoryTree(flatList)` utility, plus drag-reorder writes back via
`PUT /commerce/categories/:id` with the new `parentId`/`position`).

`GET /commerce/collections` returns `CommerceCollectionListItem[]`
(`id, name, slug, productIds, createDate, updateDate`) — **no manual-vs-rule-based type
exists on the backend at all** (confirmed: zero references anywhere in the branch).
**Correction from mockup, important**: remove the "نوع گردآوری: دستی / خودکار" toggle from
the "کالکشن جدید" dialog entirely, and remove the "خودکار" badge variant from the collection
cards — there is nothing to bind either to, and shipping a control for a feature that
silently does nothing would be worse than not having it.

## Screen 4 — Bulk import

Confirmed real, already implemented on the Back branch, as an **async BullMQ job**, not a
synchronous request — this changes the wizard shape from the mockup non-trivially:

1. `POST /commerce/import` (multipart `file`, `.csv`/`.xlsx`/`.xls`) → `{jobId}` immediately.
2. Poll `GET /commerce/import/:jobId` → `{state, processed, failed, errorReportFileId?}`
   until `state === 'completed'` (or a terminal failed state).

**Correction from mockup, structural**: the mockup's 4-step wizard had a client-side "column
mapping" step (map spreadsheet columns to product fields) and a client-side "preview
validation" step with a live row-by-row error table, both **before** submitting. The real
backend has a **fixed column order** (`title, description, status, kind, category,
option1Name, option1Value, option2Name, option2Value, option3Name, option3Value, sku, price,
compareAtPrice, stock, trackInventory, weight`) baked into the parser — there is no
column-mapping endpoint, and there is no pre-submit validation call; validation only happens
after upload, inside the async job. So the wizard becomes:

1. **Upload** — same dropzone as mockup, but copy must state the fixed column order (link to
   a static sample file matching that exact header row — the mockup's "دانلود فایل نمونه"
   button becomes load-bearing, not decorative: generate a real sample .csv/.xlsx with those
   17 headers).
2. **Processing** — replaces the mockup's "column mapping" and "preview" steps with a single
   polling screen (spinner + `processed` count ticking up, poll every ~1.5s) since the
   backend does the mapping/validation server-side, invisibly, inside the job.
3. **Result** — `processed`/`failed` counts (matches mockup's summary tiles conceptually,
   different source), and if `errorReportFileId` is present, a "دانلود گزارش خطاها" button
   that resolves that file id to a download URL through the existing file-download route
   (not a commerce route — find and reuse the existing `FileEntity` download URL pattern
   used elsewhere in the dashboard, e.g. for excel exports).

The "ستون‌های تکراری"/inline error-table step from the mockup is dropped — there is no data
to populate it with before the async job runs. This is a real, material simplification vs.
the mockup and should be called out to the user as such (not silently done).

## Explicit list of "built in the mockup but not carried over" (all corrections above, indexed)

1. List page sort-order chip — dropped, no backend param.
2. List page per-card strikethrough discount price — replaced with min/max price range.
3. List page "اتمام موجودی" filter chip — dropped; `needsStockReview` badge kept instead.
4. Product `kind` third option "خدمت" (service) — dropped, not a real enum value.
5. Categories-on-product as a multi-select chip UI in its own tab — merged into Basic Info
   as the single real `categoryId` field.
6. Collection-type "دستی/خودکار" toggle — dropped entirely, no backend concept.
7. Inventory ledger "note" field (input + column) — dropped, no backend column.
8. Inventory ledger "resulting balance" — kept, but computed client-side, not read from API.
9. Adjust-stock "نوع تغییر" reason dropdown — kept only as a UI framing helper, not sent/
   persisted as entered.
10. Shipping "ارسال رایگان" (free-shipping-threshold) toggle — dropped, no backend field.
11. Bulk import column-mapping step — dropped, backend has a fixed column order.
12. Bulk import pre-submit validation preview step — replaced with an async-job polling step.

## Resolved: list-page thumbnails

Raised to the user as an open question; resolved as "add `coverMediaUrl` to the backend
DTO" (not a placeholder-only ship, not a frontend batch-fetch workaround). Implemented on
the Back branch same day — see Screen 1 above. No outstanding open questions remain.
