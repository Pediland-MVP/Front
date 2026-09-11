# Commerce Variants & Pricing Section (Task 5) — 2026-07-22

Full design/plan reference:
- `Front/docs/superpowers/specs/2026-07-22-commerce-product-management-design.md`
- `Front/docs/superpowers/plans/2026-07-22-commerce-product-management.md`
- Follow-up to `2026-07-22-commerceProductManagementFoundation.update.md` (Tasks 1-3).

## Problem

Task 3 built the product editor shell with a `variants` section that was only a placeholder
card — `options`/`variants` had no real UI, so `ProductEditorPage.tsx`'s `buildUpdatePayload`
deliberately never sent them on `PUT /commerce/products/:id` (documented at the time as a
known gap to close once this task landed). A brand-new product also needs the cartesian
product of option values turned into a generated, editable variant table, capped at 2000
combinations, without ever discarding a merchant's already-entered prices when they tweak an
option afterward.

## Solution

1. **`variantMatrix.util.ts`** — the pure cartesian-product generator
   (`generateVariantCombinations(optionValueCounts)` → `number[][]` of positional
   `valueIndexes`), plus the `VARIANT_LIMIT` (2000) / `OPTION_LIMIT` (3) constants. Stays
   pure and non-throwing; the caller is responsible for the 2000-cap guard.
2. **`VariantsSection.tsx`** — options builder (up to 3 option rows, drag-reorder via
   `@dnd-kit`, name + style picker `dropdown`/`button`/`color`, chip-based value entry,
   per-value `colorHex` swatch for `style === 'color'`) plus the generated variant table
   (drag-order not needed here; columns: media placeholder, variant label derived from
   `valueIndexes`, SKU, price, compareAtPrice, a Popover-based "فروش ویژه" mini-form
   (salePrice + saleStartsAt/saleEndsAt), stock (`initialStock` input in create mode,
   read-only `onHand` + redirect note in edit mode — stock edits are Task 7's job),
   `trackInventory`/`allowBackorder`/`isActive` switches, delete-row button).
3. **Regenerate diffing ("بازسازی جدول تنوع‌ها")** — computes `optionValueCounts`, hard-blocks
   (toast, not silent truncation) if the product exceeds `VARIANT_LIMIT` or if any option has
   zero values yet, otherwise diffs the newly generated combinations against the current
   `variants` array by `valueIndexes.join(',')` — any combination that still exists keeps its
   `id`/price/SKU/toggles untouched, only new/removed combinations change. Verified explicitly
   with a dedicated test (not just code review) that adding/removing a value preserves the
   survivors' data.
4. **Client-side "at least one active variant" guard** — mirrors the backend's
   `assertHasLiveVariant`: the `isActive` switch and delete button are disabled (with an
   inline explanatory note) for the only remaining active variant, and the zod schema has a
   matching `.refine` as a submit-time safety net.
5. **Inline price validation matching the backend exactly** — `productForm.schema.ts`'s
   `variantSchema` gained a `.superRefine` enforcing `compareAtPrice > price` (strictly, not
   `>=`), `salePrice < price`, and `salePrice`/`saleStartsAt` set together — all surfaced as
   `FormMessage`s before submit instead of after a 400.
6. **`buildUpdatePayload` now conditionally includes `options`/`variants`** — gated on
   `form.formState.dirtyFields.options`/`.variants` (react-hook-form marks these dirty on any
   `useFieldArray`/`setValue` write from `VariantsSection`), closing the gap Task 3 left open.
   Verified in both directions: a product edited only via Shipping still omits
   `options`/`variants` (existing test), and editing the variant table now includes `variants`
   while still omitting untouched `options` (new test).
7. Exposed `Popover`/`PopoverContent`/`PopoverTrigger` from the shared `@befroosh/ui` barrel
   (`packages/ui/src/components/ui/index.ts`) — the primitive already existed
   (`popover.tsx`, used internally by `date-picker.tsx`) but wasn't re-exported for direct use.

## Changes

- New: `apps/dashboard/src/components/Commerce/ProductEditor/variantMatrix.util.ts` (+ test)
- New: `apps/dashboard/src/components/Commerce/ProductEditor/sections/VariantsSection.tsx`
  (+ test)
- New: `apps/dashboard/src/components/Commerce/ProductEditor/productForm.schema.test.ts`
  (covers the new price/active-variant `.refine`/`.superRefine` rules)
- Modified: `apps/dashboard/src/components/Commerce/ProductEditor/productForm.schema.ts`
  (`variantSchema` gained the price cross-field `.superRefine`; the `variants` array schema
  gained the at-least-one-active `.refine`)
- Modified: `apps/dashboard/src/components/Commerce/ProductEditor/ProductEditorPage.tsx`
  (`buildUpdatePayload` now takes `dirtyFields` and conditionally includes `options`/
  `variants`; renders `VariantsSection` for the `variants` scrollspy section)
- Modified: `apps/dashboard/src/components/Commerce/ProductEditor/ProductEditorPage.test.tsx`
  (new describe block asserting the dirty-field gating in both directions)
- Modified: `packages/ui/src/components/ui/index.ts` (added `export * from './popover'`)
- `apps/dashboard/src/messages/fa.json`: added `Commerce.Editor.Variants.*` i18n and 4 new
  `Commerce.Editor.Validation.*` keys (`compareAtPriceInvalid`, `salePriceInvalid`,
  `saleWindowRequired`, `atLeastOneActiveVariantRequired`).

## Verification

`cd apps/dashboard && npx vitest run src/components/Commerce`:

```
✓ src/components/Commerce/ProductEditor/productForm.schema.test.ts (9 tests)
✓ src/components/Commerce/ProductEditor/variantMatrix.util.test.ts (7 tests)
✓ src/components/Commerce/ProductEditor/EditorScrollspyNav.test.tsx (3 tests)
✓ src/components/Commerce/ProductEditor/sections/MediaSection.test.tsx (7 tests)
✓ src/components/Commerce/ProductList/ProductListPage.test.tsx (9 tests)
✓ src/components/Commerce/ProductEditor/sections/VariantsSection.test.tsx (7 tests)
✓ src/components/Commerce/ProductEditor/ProductEditorPage.test.tsx (3 tests)

Test Files  7 passed (7)
     Tests  45 passed (45)
```

`npx tsc --noEmit` shows no new errors introduced (only the two pre-existing baselined
warnings: the zod/`zodResolver` version-mismatch type error on `ProductEditorPage.tsx`'s
`resolver:` line, and the `Badge` `children` prop type gap also hit by `MediaSection.tsx` and
`CommerceProductCard.tsx` — both pre-date this task).
