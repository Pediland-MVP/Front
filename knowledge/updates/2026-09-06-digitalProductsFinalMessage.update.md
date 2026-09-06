# 2026-09-06 — Digital products + final message on order completion

**Related docs:** `Back/knowledge/updates/2026-09-06-digitalProductsFinalMessage.update.md`
(backend implementation, schema, migrations), `Back/knowledge/core/commerce/orders.doc.md`
(Buyer notification section).

## Problem

Physical and digital products have different fulfillment: a physical product waits for manual review,
shipment tracking, and payment verification. A digital product's order completes immediately on
purchase (no shipment exists), and a seller should be able to send a completion message to the buyer
—— e.g., a download link, an unlocking code, a coupon, or simply an invoice reference and a thank-you
note. The backend added `kind` (physical/digital) and `finalMessage` (text sent on completion) to
`CommerceProductDetail`, but the frontend product editor and product list still treated all products
as physical, with no way to choose kind or compose the completion DM.

## Solution

The product editor now gates the initial product creation with a physical/digital choice dialog
(`ChooseProductKindDialog`), seeding the editor form's initial `kind` from a `?kind=` query param.
Two new editor sections (`ProductKindSection`, `FinalMessageSection`) let a seller view/edit the
product kind and write the completion DM (up to 1000 characters, matching the backend validation).

### New form layer

`productEditor.schema.ts`:

- `ProductFormValues` gains two new required fields (`kind: CommerceProductKind`, `finalMessage: string`).
- `buildProductEditorSchema` validates `kind` as `z.enum(['physical', 'digital'])` and `finalMessage`
  as `z.string().max(1000)` — no min, so an empty string (no completion DM) is valid.
- `buildEmptyProductForm(kind = 'physical')` now accepts a `kind` parameter and seeds both fields
  in the form default.

### Product editor integration

`ProductEditorPage.tsx`:

- Reads `?kind=physical|digital` from the URL's search params (`useSearchParams`).
- Passes `initialKind` to `buildEmptyProductForm()` on first render and to `ProductEditorBody`'s
  baseline ref — seeding the kind field exactly once, surviving edits without re-seeding.
- Renumbered `STEPS` to make `kind` step 1 (promotion before title), `finalMessage` step 11 (last,
  after all variants). Every other step shifted +1 accordingly.
- Renders `<ProductKindSection>` as the first editor step (two pressable cards: physical / digital,
  driven by `watch`/`setValue` from `useFormContext`).
- Renders `<FinalMessageSection>` as the final step (a textarea with live character-count hint).

The mapping layer (`productEditor.mapping.ts`):

- `CreateProductPayload`: now types `kind: CommerceProductKind` (was hardcoded `'physical'`);
  optional `finalMessage?: string` sent only when non-empty (trimmed), omitted when blank.
- `UpdateProductPayload`: always sends `kind` and `finalMessage` (non-optional `string | null`,
  `null` when blank, trimmed string otherwise) — the asymmetry lets create skip a blank message
  entirely, while update can explicitly clear one.
- `mapDetailToFormValues`: reads `product.kind` and converts `product.finalMessage ?? ''`
  (null → empty string for the textarea).

### Product list UI

`ProductListPage.tsx` & `ChooseProductKindDialog.tsx` (new):

- The "Add product" button now opens `ChooseProductKindDialog` instead of navigating directly
  to `/products/add`.
- `ChooseProductKindDialog`: a dialog with two pressable cards (physical / digital description
  and title pairs). Clicking a card closes the dialog and navigates to `/products/add?kind=physical`
  or `?kind=digital`.
- New i18n namespace `Commerce.List.ChooseKind` in `fa.json` holds the dialog title and card
  descriptions for both kinds.

### i18n updates

`apps/dashboard/src/messages/fa.json`:

- New `Commerce.Editor.Kind` namespace (title, physical, digital, hint) inserted before
  `Commerce.Editor.Title`.
- New `Commerce.Editor.Validation.finalMessageMax` key for the zod max-length message.
- New `Commerce.Editor.FinalMessage` namespace (title, hint, placeholder, counter) inserted
  before `Commerce.Editor.Errors`.
- New `Commerce.List.ChooseKind` namespace (title, physicalTitle/Description, digitalTitle/Description)
  inserted after `Commerce.List.Toast` and before `Commerce.List.Card`.

## Changes

| File | Change |
|---|---|
| `apps/dashboard/src/types/commerce.ts` | Added `finalMessage: string \| null;` to `CommerceProductDetail` (Task 6) |
| `apps/dashboard/src/components/Commerce/ProductEditor/productEditor.schema.ts` | Added `kind` and `finalMessage` fields to `ProductFormValues`, zod validators, and param to `buildEmptyProductForm` (Task 7) |
| `apps/dashboard/src/components/Commerce/ProductEditor/productEditor.schema.test.ts` | Added 2 describe blocks testing `kind` and `finalMessage` validation (Task 7) |
| `apps/dashboard/src/components/Commerce/ProductEditor/sections/AttributesSection.test.tsx` | Updated `ProductFormValues` literal in test fixture to include new required fields (Task 7) |
| `apps/dashboard/src/components/Commerce/ProductEditor/sections/BasePriceSection.test.tsx` | Updated `ProductFormValues` literal in test fixture to include new required fields (Task 7) |
| `apps/dashboard/src/test/renderWithForm.tsx` | Shared test helper's `ProductFormValues` literal updated to include `kind`/`finalMessage` (Task 7) |
| `apps/dashboard/src/components/Commerce/ProductEditor/productEditor.mapping.ts` | Wired `kind`/`finalMessage` through create/update payloads and detail-to-form mapping (Task 8, asymmetric omit-when-blank create vs always-send update) |
| `apps/dashboard/src/components/Commerce/ProductEditor/productEditor.mapping.test.ts` | Added 5 test cases for `kind`/`finalMessage` in mapping (Task 8) |
| `apps/dashboard/src/components/Commerce/ProductEditor/ProductEditorPage.tsx` | Added `useSearchParams`, seeded `initialKind` from `?kind=`, passed to form baseline and editor body; renumbered `STEPS`; wired new sections; fixed stale doc-comment (Tasks 9–12) |
| `apps/dashboard/src/components/Commerce/ProductEditor/ProductEditorPage.test.tsx` | Added tests verifying query param seeding and step renumbering (Task 9) |
| `apps/dashboard/src/components/Commerce/ProductEditor/sections/ProductKindSection.tsx` *(new)* | Two pressable cards (physical / digital) driven by `watch`/`setValue` from form context (Task 10) |
| `apps/dashboard/src/components/Commerce/ProductEditor/sections/ProductKindSection.test.tsx` *(new)* | Three test cases: default-pressed, digital-seed, click-switches-value (Task 10) |
| `apps/dashboard/src/components/Commerce/ProductEditor/sections/FinalMessageSection.tsx` *(new)* | Textarea with live character-count hint, `useWatch` for count only (Task 11) |
| `apps/dashboard/src/components/Commerce/ProductEditor/sections/FinalMessageSection.test.tsx` *(new)* | Full editor suite tests for final message textarea and character counter (Task 11) |
| `apps/dashboard/src/components/Commerce/ProductList/ChooseProductKindDialog.tsx` *(new)* | Two pressable cards (physical / digital); clicking navigates to `/products/add?kind=` (Task 12) |
| `apps/dashboard/src/components/Commerce/ProductList/ChooseProductKindDialog.test.tsx` *(new)* | Tests for dialog appearance, card clicks, and navigation routing (Task 12) |
| `apps/dashboard/src/components/Commerce/ProductList/ProductListPage.tsx` | Wired "Add product" button to open `ChooseProductKindDialog`; removed unused `router`/`useRouter` (Task 12) |
| `apps/dashboard/src/components/Commerce/ProductList/ProductListPage.test.tsx` | Updated tests to verify "Add product" button opens dialog instead of navigating directly (Task 12) |
| `apps/dashboard/src/messages/fa.json` | Four new namespaces: `Commerce.Editor.Kind`, `Commerce.Editor.Validation.finalMessageMax`, `Commerce.Editor.FinalMessage`, `Commerce.List.ChooseKind` (fa.json only, per CLAUDE.md §8; updated across Tasks 10, 11, 12) |

## Verification

All test suites from Tasks 6–12 passing throughout:

- **Task 6 (type check):** `pnpm --filter front exec tsc --noEmit` — zero new errors introduced.
- **Task 7 (schema tests):** `2 describe blocks added (kind, finalMessage validation)` — full suite passing.
- **Task 8 (mapping tests):** Existing create/update/detail-to-form tests revalidated. All passing.
- **Task 9 (seed from query):** Verified `initialKind` extraction and form baseline seeding.
- **Task 10 (ProductKindSection tests):** `3 cases (default, digital-seed, click-switch)` passing.
- **Task 11 (FinalMessageSection):** Full editor test suite passing, character-count reactive.
- **Task 12 (ChooseProductKindDialog):** Dialog routing verified (`/products/add?kind=physical|digital`).

**Full editor + ProductList suites:** All existing tests continue to pass; no regressions in
related commerce components. Pre-existing tsc baseline unaffected.

**Manual verification:** Dialog appearance and routing tested; editor step rendering and
form value propagation verified; mapping asymmetry (create omits blank, update sends null)
confirmed in payload inspection.

**Final tsc run:** After the housekeeping fix to `useProductSave.test.ts`, the `finalMessage`
missing-field error is gone. Pre-existing baseline errors (`Badge children` type, etc.) unchanged.
