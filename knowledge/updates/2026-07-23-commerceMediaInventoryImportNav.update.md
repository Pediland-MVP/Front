# Commerce Product Management — Media, Inventory, Collections-in-Editor, Bulk Import, Nav+Cleanup (Tasks 4, 7, 8, 10, 11)

Full design/plan reference:
- `Front/docs/superpowers/specs/2026-07-22-commerce-product-management-design.md`
- `Front/docs/superpowers/plans/2026-07-22-commerce-product-management.md`
- Follow-ups to `2026-07-22-commerceProductManagementFoundation.update.md` (Tasks 1-3),
  `2026-07-22-commerceVariantsPricing.update.md` (Task 5),
  `2026-07-23-commerceVariantMediaPicker.update.md` (Task 6),
  `2026-07-23-commerceTaxonomyManagement.update.md` (Task 9).

This doc closes out the remaining tasks of the 11-task `feat/commerce-product-core` plan.
All 11 tasks are now complete, individually reviewed (several through 2-3 fix rounds after
real bugs were caught), and passed a final whole-branch review (TARGET MET, one Important
permission-gating gap found and fixed — see
`2026-07-23-commerceProductCorePermissionGapFix.update.md`).

## Task 4 — Media section

`MediaSection.tsx`: upload (via `FileUploader`, `multiple`), drag-reorder (`@dnd-kit`), and
delete for a product's media pool. Establishes the convention every later mutating section
in this feature reuses: **the shared `/commerce/products/:id` SWR cache is the single source
of truth** — no parallel local `useState` media array. Every mutation (upload/reorder/
delete) does an optimistic `mutate(key, updater, {revalidate:false})` write for instant
feedback, then a plain revalidating `mutate(key)` once the real API call settles. This
exists because `POST .../media`'s own response has no resolved `url` (the raw entity only),
so rendering straight from it would show a broken image — revalidating against the shared
`GET /commerce/products/:id` (which Back commit `dd45d1fc` added a `media[]` field to) is the
only way to get a real, displayable URL. Cover badge = whichever tile has `position === 0`
(implicit, no separate flag). Video tiles show `posterUrl ?? url`, never an embedded player.

**Cross-cutting fix landed here**: `packages/ui/src/components/ui-custom/FileUploader.tsx`
had a real bug — `multiple` prop was accepted but ignored (`useDropzone({multiple:false})`
hardcoded, no `multiple` attribute on the native `<input>`), so the batch-upload logic this
task built was unreachable through the real UI regardless of the prop. Fixed the shared
component (both the dropzone config and the native input attribute now honor the real
prop value); verified the only other caller (`ProductForm.tsx`, legacy, since deleted in
Task 11) never passed `multiple`, so this was purely additive.

## Task 7 — Inventory section

`InventorySection.tsx` + `reconstructLedgerBalances.util.ts` + `AdjustStockDialog.tsx`. The
ledger has no stored "balance after" column (only signed `delta` per row) and no note field
— both dropped from the original mockup per the design spec's corrections. Balance is
reconstructed client-side: walking a DESC-ordered movement list, each row's `balanceAfter`
equals the running balance *before* subtracting that row's own `delta`.

**Real bug found and fixed post-implementation**: the first version called
`reconstructLedgerBalances` once **per displayed page**, anchored on the variant's absolute
current `onHand` every time — correct only for page 1. For page 2+, an older row was
silently treated as if it were the newest movement, corrupting every `balanceAfter` shown on
that page with no indicator. Fixed by fetching a single larger page (backend's real
`@Max(200)` cap) once, reconstructing ONCE over the whole set, then paginating the
already-reconstructed array **client-side** for display — with a visible "showing the most
recent N only" notice if the backend reports more movements than the fetch cap holds.

**Backend gap found and fixed**: `GET /commerce/products/:id` never returned a variant's
`lowStockThreshold` even though `PATCH .../stock` persists it, so `AdjustStockDialog` could
only ever show the field blank. Fixed on Back (`56276b7a`) and wired through
(`InventorySection.tsx` → `AdjustStockDialog`'s `currentLowStockThreshold` prop, seeded on
every dialog open).

The "نوع تغییر" (increase/decrease) toggle in `AdjustStockDialog` is a pure client-side
helper — it only affects how a typed delta is folded into the single "new stock" number the
request actually sends (`onHand`, always absolute); the backend always records
`reason: manual` for a user-initiated edit regardless of which toggle direction was used.

## Task 8 — Collections assignment (in the product editor)

`CollectionsSection.tsx` + `toggleProductInCollection.ts`. Category assignment stays entirely
in Task 3's `BasicInfoSection.tsx` (a single `categoryId` field) — this section is
collections-membership only, despite the plan's task title suggesting a broader scope.
`PUT /commerce/collections/:id` has full-replace semantics (no product-scoped "add to
collection" endpoint exists), so toggling a chip here is a read-modify-write:
`toggleProductInCollectionMembership` computes the new full `productIds[]`, then the whole
array is PUT back.

**Urgent backend bug found and fixed** (discovered while reviewing the *next* task, Task 9 —
by then Task 8 was already shipped): `UpsertCommerceCollectionDto.name` had no
`@IsOptional()`, so this exact membership-only PUT (`{productIds}`, no `name`) was rejected
with a 400 in practice — meaning Task 8's whole feature was broken against the real backend
from the moment it shipped, until the fix (Back commit `734ef03b`) landed. No frontend
change was needed; the frontend was already sending the correct minimal payload.

## Task 9 addendum — sibling bug found via Task 9's review

Task 9 (taxonomy screen, see its own doc) sends a category drag-reorder PUT as
`{parentId, position}`, no `name`. The implementer honestly flagged this as an unconfirmed
assumption; investigation confirmed the identical `@IsOptional()` gap on
`UpsertCommerceCategoryDto.name` (Back commit `9d8c981c`, fixed before Task 9's own review
completed).

## Task 10 — Bulk import screen

`ImportWizard.tsx` + `useImportJobPolling.ts` + a real, load-bearing sample CSV
(`public/commerce-import-sample.csv`, exact 17-column header order). 3 real steps only —
Upload → Processing → Result — since the backend has a fixed column order and validates
only inside its async BullMQ job (no client-side column-mapping or pre-submit
validation-preview step, unlike the original mockup). Polling uses SWR's function-form
`refreshInterval`, returning `0` once `state` is terminal (`completed`/`failed`) to
genuinely stop, not just skip a tick.

**Backend gap found and fixed**: the job status's `errorReportFileId` was a bare
`file_entity` id with **no route anywhere in the app** to resolve it into a download URL
(confirmed: excel exports email the file instead of linking it — there was no precedent to
reuse). The implementer correctly shipped a real, visible, but honestly *disabled* download
affordance rather than guess at a backend contract. Fixed on Back
(`CatalogReadService.fileUrlById`, commit `a0bad83c`) — the status response now returns a
resolved `errorReportUrl`, and the frontend's disabled placeholder became a real
`<a href download>` link.

## Task 11 — Sidebar nav + legacy removal (final task)

Added 2 sidebar children under "کالا و خدمات" — "دسته‌بندی و کالکشن" → `/products/taxonomy`,
"وارد کردن گروهی" → `/products/import` (`ConsoleSidebar.tsx`). Deleted the legacy
`components/Products/` folder and `app/(Console)/products/components/` folder (grep-confirmed
dead, independently re-verified in review with fresh greps against the post-deletion tree).

**Deliberately kept**: `src/types/product.ts` — still imported by the live, out-of-plan-scope
Shop/Checkout flow (`app/(Shop)/[shopId]/[productId]/order/**`, `CheckoutPage.tsx`).
Deleting it would have broken checkout; this was the correct call, verified in review.

**Known minor gaps** (cosmetic, not blocking): the 3 Products sidebar children
(`/products`, `/products/taxonomy`, `/products/import`) share a string prefix, so
`NavMain.tsx`'s `pathname.startsWith()` highlight logic marks more than one item active
simultaneously on the two new sub-pages. The top-level `Products.*` i18n namespace is now
mostly (not fully — `Products.free` is still used by the Shop checkout, do not delete it
if pruning later) orphaned since every dashboard component that used it was deleted.

## Final whole-branch review

TARGET MET. One Important finding: several mutations (media upload/reorder/delete,
per-variant media save, stock adjust, collection-membership toggle, all of taxonomy
create/update/delete, and the import upload) were not permission-gated on the frontend like
`ProductListPage` and the editor's Save button already were — low exposure (the backend
routes enforce the real `PERMISSION_GUARD` regardless), but a real consistency gap. Fixed:
see `2026-07-23-commerceProductCorePermissionGapFix.update.md`. Verified backend permission
requirements directly rather than assumed — categories and collections both require
`PRODUCT_EDIT` for create/update/delete alike (no separate create/delete slug, unlike
products).

## Verification

- Full `src/components/Commerce` + `src/utils/commerce` suite: 127/127 passing across 20
  files (independently re-run, not just trusted from any single task's report).
- `npx tsc --noEmit` on `apps/dashboard`: zero new errors from any commerce file (all
  reported errors are confirmed pre-existing baseline noise — a repo-wide zod v3/v4 resolver
  typing conflict, and a `Badge` component `variant`/`children` typing quirk already present
  in unrelated files like `AutomationCard.tsx`/`OrderCard.tsx`). Two real, narrow tsc issues
  found on this first-ever full run were fixed directly: two test files (Tasks 1, 8) used
  vitest's global `describe`/`it`/`expect` instead of importing them like every other test
  file does, and one `VariantsSection.test.tsx` fixture was missing the `lowStockThreshold`
  field added to `CommerceVariantDetail` in a later commit.

## Backend gaps found this session (summary, all fixed on the paired Back branch)

Nine real "a write path existed, nothing could read it back" bugs were found and fixed on
`Back/worktrees/commerce-product-core` while building this Front branch:
`coverMediaUrl` (list DTO), `media[]` (detail DTO), writable `shippingCost`, readable
per-variant media assignment, readable variant `lowStockThreshold`, optional category
`name` on update, optional collection `name` on update (this one broke an already-shipped
feature, Task 8), and a resolved import error-report URL. Each Back commit is cross-
referenced in this doc and its siblings; see
`Back/knowledge/updates/2026-07-2{2,3}-commerce*.update.md` for the Back-side detail on each.
