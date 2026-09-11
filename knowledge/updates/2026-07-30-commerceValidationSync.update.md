# 2026-07-30 — Commerce product validation, front/back sync

Reference: `docs/superpowers/specs/2026-07-30-commerce-validation-sync-design.md` (the
full contract — bounds table, decisions, and rationale). Back counterpart:
`Back/knowledge/updates/2026-07-30-commerceValidationSync.update.md`.

## Problem

The product editor's `buildProductEditorSchema` zod schema and the backend's
`class-validator` DTO were written independently and disagreed in both directions — the
catalogue is the most data-sensitive part of the app, so a mismatch here means a merchant
either hits a raw 400 with nothing highlighted on the form, or the form itself accepts data
the backend would reject or silently 500 on. Findings that motivated the tightening (full
detail in the Back doc, since the enforcement moved server-side too):

1. **The backend's `variants` array had no bound at all** — `@IsArray()` only, no min or
   max — so the API accepted a product with zero variants (the grid can't even represent
   that) or an unbounded number, while the form already assumed 1–2000. The gap wasn't in
   the frontend, but it's why `variants` min/max stayed enforced on both sides rather than
   being treated as "already covered by the UI".
2. **A CSV import bypasses every DTO decorator** — `import.processor.ts` calls
   `productService.createProduct(...)` with a plain object, never through
   `ValidationPipe`. This is why the backend's real guarantee lives in the service, not the
   DTO — relevant here because it means the editor's zod schema and the DTO decorators are
   *both* just fast-fail layers; the service is the actual source of truth both must match.
3. **`weight` behind an unbounded `@IsInt()`** — a large number reached the `int4` column
   and 500'd instead of validating. The frontend's `weight` field had no ceiling either, so
   a merchant typing a huge number for this normally-hidden field got a raw driver error.

## Solution

`buildProductEditorSchema` (`ProductEditor/productEditor.schema.ts`) tightened to match the
backend contract, split across two commits:

**Product-level** (`985b8850`):
- `description` — was a bare `z.string()` (empty string accepted); now
  `.trim().min(1, descriptionRequired).max(20_000, descriptionMax)`.
- `categoryId` — was `z.string().nullable()` (i.e. optional); now rejects both `null` and
  `''`/whitespace via `.min(1, ...)` plus a `.refine((v) => v != null, ...)` — zod v3's
  `.nullable()` + `.min()` alone does not fire on an actual `null`, only once the value
  reaches the string branch, so the explicit refine is required.
- `option.name` / option `value` — added `.max(100, ...)` each.
- `spec.title` / `spec.body` — added `.max(100, ...)` / `.max(500, ...)`.
- `colorHex` — was a bare optional string; now
  `.regex(/^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, ...)`.

**Variant-level** (`aedfb764`, fixed up in `b22c839b`):
- `price`/`stock` gained `.max()` ceilings; `compare`/`salePrice` gained
  `.max(MAX_AMOUNT)` (999,999,999,999 — the bigint column bound).
- `sku` gained `.trim().max(100, ...)`.
- `weight` gained `.int(...)`, `.nonnegative(...)`, `.max(MAX_WEIGHT, ...)` (10,000,000 —
  matches the backend's `int4`-safe grams ceiling) — this is what makes both `1.5` and `-1`
  fail, for non-int and negative respectively.
- `superRefine` gained four cross-field checks: **tracked-variant stock is required**
  unless the variant is marked `∞` (infinite/untracked); `salePrice` must be strictly less
  than `price`; `salePrice` and `saleStartsAt` must be set together or neither; and when
  both `saleStartsAt` and `saleEndsAt` are present, `saleEndsAt` must be after
  `saleStartsAt` (checked via `Date.parse`, guarded by `Number.isFinite` — a lone
  `saleEndsAt` with no `saleStartsAt` is legal data, mirroring the DB CHECK that only pairs
  `salePrice` with `saleStartsAt`).
- Fix-up commit `b22c839b`: the brief's own `variantSchema` snippet left `compare`'s and
  `salePrice`'s `.max(MAX_AMOUNT)` without a `message`, so an over-ceiling value surfaced
  zod's raw English default instead of Persian copy (violates CLAUDE.md §8 — every
  user-facing string must live in `fa.json`). Routed both through a new shared
  `Validation.amountMax` key instead.

Task 3 (backend `assertProductInvariants`) and Tasks 4/5 (backend DTO bounds + import test)
touched no frontend files — the contract those enforce was already covered by Tasks 1/2's
zod changes, since the frontend was the side missing the rules in most of those cases.

## Changes

- `apps/dashboard/src/components/Commerce/ProductEditor/productEditor.schema.ts` — product-
  and variant-level bounds above.
- `apps/dashboard/src/components/Commerce/ProductEditor/productEditor.schema.test.ts` — new
  `describe` blocks for product-level rules (9 tests) and variant-level rules (10 tests,
  +1 in the fix-up commit); `form()` fixture updated to include a valid `description` and
  `categoryId` so every pre-existing test keeps passing under the newly-required fields.
  The old `'allows a null stock'` test was rewritten (not deleted) to
  `'allows a null stock when the variant is ∞...'`, passing `infinite: true`, so it still
  documents the narrower case where a null stock remains valid.
- `apps/dashboard/src/messages/fa.json` — 18 new `Commerce.Editor.Validation` keys across
  the two commits (`descriptionRequired`, `descriptionMax`, `categoryRequired`,
  `specTitleMax`, `specBodyMax`, `optionNameMax`, `optionValueMax`, `colorHexInvalid`,
  `priceMax`, `stockRequired`, `stockMax`, `skuMax`, `weightInvalid`, `weightMax`,
  `salePriceInvalid`, `salePricePairing`, `saleWindowInvalid`, `amountMax`) — this task
  additionally added 8 top-level `ERROR_CODES` keys (see below).
- **This task (Task 6)** — added 8 keys to the top-level `ERROR_CODES` object (backend
  error codes surfaced via `t_ec`, not the `Commerce.Editor.Validation` client-side
  messages above): the six new codes from the backend service
  (`COMMERCE_PRODUCT_TITLE_REQUIRED`, `COMMERCE_PRODUCT_DESCRIPTION_REQUIRED`,
  `COMMERCE_PRODUCT_CATEGORY_REQUIRED`, `COMMERCE_VARIANT_LIMIT`,
  `COMMERCE_VARIANT_STOCK_REQUIRED`, `COMMERCE_INVALID_SALE_WINDOW`), plus two
  pre-existing backend codes that had no Persian copy at all until now
  (`COMMERCE_INVALID_SALE_PRICE`, `PRODUCT_DISCOUNT_PRICE_IS_BIGGER_THAN_PRICE`). A
  verification sweep (every `badRequest('CODE', ...)` thrown under
  `Back/apps/core/src/commerce` cross-checked against `fa.json`'s `ERROR_CODES`) also
  turned up two more pre-existing gaps unrelated to this plan's new work —
  `COMMERCE_DUPLICATE_VARIANT` and `COMMERCE_OPTION_VALUE_IN_USE` — added in the same pass.

## Where the rules live (source of truth)

The bounds table in `docs/superpowers/specs/2026-07-30-commerce-validation-sync-design.md`
is authoritative for **both** sides. `buildProductEditorSchema` in
`productEditor.schema.ts` and `createCommerceProduct.dto.ts` +
`Back/apps/core/src/commerce/catalog/product.service.ts` now encode the same one contract
— a bound changed on one side without updating the spec and the other side is a bug, not a
style choice.

## Verification

- `npx vitest run src/components/Commerce` (from `apps/dashboard`) — green across all prior
  tasks' additions (236 tests as of Task 2's fix-up commit; see Task 6's own verification
  sweep for the final count after this task's `fa.json`-only change, which added no new
  test cases).
- `npx tsc --noEmit 2>&1 | grep -c "error TS"` — 205 (unchanged baseline) after every
  frontend-touching commit in this range.
- Python sweep (see Back's update doc) confirming every thrown commerce error code has a
  matching `fa.json` `ERROR_CODES` key: 17 thrown, 0 missing after this task.
