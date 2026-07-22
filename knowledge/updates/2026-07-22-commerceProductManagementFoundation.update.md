# Commerce Product Management Foundation (Tasks 1-3) — 2026-07-22

Full design/plan reference:
- `Front/docs/superpowers/specs/2026-07-22-commerce-product-management-design.md`
- `Front/docs/superpowers/plans/2026-07-22-commerce-product-management.md`

## Problem

The dashboard's product-management UI (the legacy `/products` pages under
`src/components/Products/`) talks to backend routes that the paired Back branch
(`Back/worktrees/commerce-product-core`) is replacing with a new `/commerce/*` catalog API
(products, categories, options/variants, stock). The legacy pages call routes that are being
retired, so they need to be rebuilt from scratch against the new API rather than patched.
This is the first checkpoint (Tasks 1-3 of an 11-task plan) of that rebuild, all on branch
`feat/commerce-product-core`.

## Solution

Built the shared foundation the rest of the plan (Tasks 4-11: media, variants, inventory,
categories/collections, stock adjustments, legacy cutover) sits on:

1. **Shared types + category util (Task 1)** — the `CommerceProduct`/`CommerceOption`/
   `CommerceVariant`/`CommerceCategory`/`CommerceCollection`/stock types every later task reads
   from, plus a `buildCategoryTree` utility that nests a flat `GET /commerce/categories`
   response into a tree (used by the editor's category picker).
2. **Product list page (Task 2)** — replaces the legacy `/products` list with a page against
   `GET /commerce/products`: SWR-driven, debounced search, pagination, a status filter chip
   row (active/draft/archived/all — no sort or out-of-stock chip, per the design spec's
   corrections), and a product card showing a 4:3 media tile, type badge,
   `needsStockReview` warning badge, and single/range price display.
3. **Product editor shell (Task 3)** — a single `ProductEditorPage` used for both create
   (`POST /commerce/products`) and edit (`PUT /commerce/products/:id`) modes:
   - `EditorScrollspyNav`: six sections (`basic`/`media`/`variants`/`inventory`/`org`/
     `shipping`). Desktop is one continuously-scrollable page with an `IntersectionObserver`
     re-highlighting the nav as the user scrolls; mobile is a horizontal tab bar where only
     the active section is mounted at all.
   - `BasicInfoSection` (title/description/status/kind/category) and `ShippingSection`
     (`shippingCost`, using the mandatory digit-safe money-input pattern) are the only two
     sections with real fields in this checkpoint — the other four render a placeholder card
     until their own tasks land.
   - `productForm.schema.ts` owns the single `ProductFormValues` react-hook-form contract
     every section (this task's and future tasks') reads/writes via `useFormContext`, plus the
     zod schema factory and the create/edit default-value mappers.

## Changes

- New: `apps/dashboard/src/types/commerce.ts`, `apps/dashboard/src/utils/commerce/
  buildCategoryTree.ts` (+ test)
- New: `apps/dashboard/src/components/Commerce/ProductList/` (`ProductListPage.tsx`,
  `CommerceProductCard.tsx` + test)
- New: `apps/dashboard/src/components/Commerce/ProductEditor/` (`ProductEditorPage.tsx`,
  `EditorScrollspyNav.tsx` + test, `productForm.schema.ts`, `sections/BasicInfoSection.tsx`,
  `sections/ShippingSection.tsx`)
- Modified: `apps/dashboard/src/app/(Console)/products/add/page.tsx` and
  `apps/dashboard/src/app/(Console)/products/[id]/product.tsx` now render `ProductEditorPage`
  (create/edit) instead of the old vitrin/product `?t=p|v` query-param branching (confirmed
  dead — nothing in the new UI generates a `?t=v` link).
- `apps/dashboard/src/messages/fa.json` / `en.json`: added `Commerce.*` i18n (list + editor
  Nav/Basic/Shipping/SaveBar/Toast/Errors/Validation strings) and 5 new `ERROR_CODES` keys
  (`COMMERCE_KIND_LOCKED`, `COMMERCE_PRODUCT_NOT_FOUND`, `COMMERCE_OPTION_LIMIT_EXCEEDED`,
  `COMMERCE_VARIANT_LIMIT_EXCEEDED`, `COMMERCE_INVALID_SELECTION`), mirrored into
  `apps/dashboard/src/types/exceptionMessage.ts`'s error-code union (CLAUDE.md §10).

### Post-review fixes (same checkpoint, applied after Task 3's review)

- **`shippingCost` now actually reaches the backend.** `buildCreatePayload`/
  `buildUpdatePayload` in `ProductEditorPage.tsx` originally omitted `shippingCost` entirely —
  documented at the time as correct, because the paired Back branch's
  `CreateCommerceProductDto`/`UpdateCommerceProductDto` didn't accept the field yet (it would
  have been silently stripped by the whitelist validation pipe). Back commit `386378c0` added
  `shippingCost?: number` to both DTOs and wired it into `product.service.ts`'s create/update.
  Both payload builders now include `shippingCost: values.shippingCost`, so the Shipping
  section is no longer a no-op with a false-positive success toast.
- **Single breakpoint for desktop/mobile editor layout.** The outer editor container used
  Tailwind's `md:flex-row` (768px, unmodified `tailwind.config.ts`), while a separate JS
  `isMobile` state (`matchMedia('(max-width: 900px)')`) independently drove
  `EditorScrollspyNav`'s internal layout and which sections mount at all. Between 768px and
  900px this produced a broken hybrid (desktop flex-row + mobile single-section-mounted nav).
  The outer container's `md:flex-row` class was removed and replaced with a `cn(...)`
  conditional driven by the same `isMobile` boolean, so one 900px breakpoint now decides
  desktop-vs-mobile everywhere in this component tree.
- Added `ProductEditorPage.test.tsx` (2 tests) asserting `shippingCost` appears in both the
  `POST`/`PUT` request bodies, closing the gap that let the original no-op ship silently.

## Verification

`cd apps/dashboard && npx vitest run src/components/Commerce`:

```
✓ src/components/Commerce/ProductEditor/EditorScrollspyNav.test.tsx (3 tests)
✓ src/components/Commerce/ProductList/ProductListPage.test.tsx (9 tests)
✓ src/components/Commerce/ProductEditor/ProductEditorPage.test.tsx (2 tests)

Test Files  3 passed (3)
     Tests  14 passed (14)
```

`buildCategoryTree.test.ts` (Task 1) also passes independently (3 tests, run as part of Task
1's original commit).
